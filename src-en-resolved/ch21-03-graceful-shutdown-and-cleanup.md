## Graceful Shutdown and Cleanup

The code in Listing 21-20 is responding to requests asynchronously through the
use of a thread pool, as we intended. We get some warnings about the `workers`,
`id`, and `thread` fields that we’re not using in a direct way that reminds us
we’re not cleaning up anything. When we use the less elegant
<kbd>ctrl</kbd>-<kbd>C</kbd> method to halt the main thread, all other threads
are stopped immediately as well, even if they’re in the middle of serving a
request.

Next, then, we’ll implement the `Drop` trait to call `join` on each of the
threads in the pool so that they can finish the requests they’re working on
before closing. Then, we’ll implement a way to tell the threads they should
stop accepting new requests and shut down. To see this code in action, we’ll
modify our server to accept only two requests before gracefully shutting down
its thread pool.

One thing to notice as we go: None of this affects the parts of the code that
handle executing the closures, so everything here would be the same if we were
using a thread pool for an async runtime.

### Implementing the `Drop` Trait on `ThreadPool`

Let’s start with implementing `Drop` on our thread pool. When the pool is
dropped, our threads should all join to make sure they finish their work.
Listing 21-22 shows a first attempt at a `Drop` implementation; this code won’t
quite work yet.

<span class="filename">نام فایل: src/lib.rs</span>

<img class="ferris" src="img/ferris/does_not_compile.svg" alt="این کد کامپایل نمی‌شود!" title="این کد کامپایل نمی‌شود!" />

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

<span class="caption">لیستینگ ۲۱-۲۲: Joining each thread when the thread pool goes out of scope</span>

First, we loop through each of the thread pool `workers`. We use `&mut` for this
because `self` is a mutable reference, and we also need to be able to mutate
`worker`. For each `worker`, we print a message saying that this particular
`Worker` instance is shutting down, and then we call `join` on that `Worker`
instance’s thread. If the call to `join` fails, we use `unwrap` to make Rust
panic and go into an ungraceful shutdown.

Here is the error we get when we compile this code:

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0507]: cannot move out of `worker.thread` which is behind a mutable reference
  --> src/lib.rs:52:13
   |
52 |             worker.thread.join().unwrap();
   |             ^^^^^^^^^^^^^ ------ `worker.thread` moved due to this method call
   |             |
   |             move occurs because `worker.thread` has type `JoinHandle<()>`, which does not implement the `Copy` trait
   |
note: `JoinHandle::<T>::join` takes ownership of the receiver `self`, which moves `worker.thread`
  --> /rustc/2d8144b7880597b6e6d3dfd63a9a9efae3f533d3/library/std/src/thread/join_handle.rs:149:16

For more information about this error, try `rustc --explain E0507`.
error: could not compile `hello` (lib) due to 1 previous error
```

The error tells us we can’t call `join` because we only have a mutable borrow
of each `worker` and `join` takes ownership of its argument. To solve this
issue, we need to move the thread out of the `Worker` instance that owns
`thread` so that `join` can consume the thread. One way to do this is to take
the same approach we took in Listing 18-15. If `Worker` held an
`Option<thread::JoinHandle<()>>`, we could call the `take` method on the
`Option` to move the value out of the `Some` variant and leave a `None` variant
in its place. In other words, a `Worker` that is running would have a `Some`
variant in `thread`, and when we wanted to clean up a `Worker`, we’d replace
`Some` with `None` so that the `Worker` wouldn’t have a thread to run.

However, the _only_ time this would come up would be when dropping the
`Worker`. In exchange, we’d have to deal with an
`Option<thread::JoinHandle<()>>` anywhere we accessed `worker.thread`.
Idiomatic Rust uses `Option` quite a bit, but when you find yourself wrapping
something you know will always be present in an `Option` as a workaround like
this, it’s a good idea to look for alternative approaches to make your code
cleaner and less error-prone.

In this case, a better alternative exists: the `Vec::drain` method. It accepts
a range parameter to specify which items to remove from the vector and returns
an iterator of those items. Passing the `..` range syntax will remove *every*
value from the vector.

So, we need to update the `ThreadPool` `drop` implementation like this:

<span class="filename">نام فایل: src/lib.rs</span>

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

This resolves the compiler error and does not require any other changes to our
code. Note that, because drop can be called when panicking, the unwrap
could also panic and cause a double panic, which immediately crashes the
program and ends any cleanup in progress. This is fine for an example program,
but it isn’t recommended for production code.

### Signaling to the Threads to Stop Listening for Jobs

With all the changes we’ve made, our code compiles without any warnings.
However, the bad news is that this code doesn’t function the way we want it to
yet. The key is the logic in the closures run by the threads of the `Worker`
instances: At the moment, we call `join`, but that won’t shut down the threads,
because they `loop` forever looking for jobs. If we try to drop our
`ThreadPool` with our current implementation of `drop`, the main thread will
block forever, waiting for the first thread to finish.

To fix this problem, we’ll need a change in the `ThreadPool` `drop`
implementation and then a change in the `Worker` loop.

First, we’ll change the `ThreadPool` `drop` implementation to explicitly drop
the `sender` before waiting for the threads to finish. Listing 21-23 shows the
changes to `ThreadPool` to explicitly drop `sender`. Unlike with the thread,
here we _do_ need to use an `Option` to be able to move `sender` out of
`ThreadPool` with `Option::take`.

<span class="filename">نام فایل: src/lib.rs</span>

<img class="ferris" src="img/ferris/not_desired_behavior.svg" alt="این کد رفتار مورد انتظار را ندارد." title="این کد رفتار مورد انتظار را ندارد." />

```rust
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}
// --snip--
impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        // --snip--

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);

            worker.thread.join().unwrap();
        }
    }
}
```

<span class="caption">لیستینگ ۲۱-۲۳: Explicitly dropping `sender` before joining the `Worker` threads</span>

Dropping `sender` closes the channel, which indicates no more messages will be
sent. When that happens, all the calls to `recv` that the `Worker` instances do
in the infinite loop will return an error. In Listing 21-24, we change the
`Worker` loop to gracefully exit the loop in that case, which means the threads
will finish when the `ThreadPool` `drop` implementation calls `join` on them.

<span class="filename">نام فایل: src/lib.rs</span>

```rust
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker { id, thread }
    }
}
```

<span class="caption">لیستینگ ۲۱-۲۴: Explicitly breaking out of the loop when `recv` returns an error</span>

To see this code in action, let’s modify `main` to accept only two requests
before gracefully shutting down the server, as shown in Listing 21-25.

<span class="filename">نام فایل: src/main.rs</span>

```rust
fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}
```

<span class="caption">لیستینگ ۲۱-۲۵: Shutting down the server after serving two requests by exiting the loop</span>

You wouldn’t want a real-world web server to shut down after serving only two
requests. This code just demonstrates that the graceful shutdown and cleanup is
in working order.

The `take` method is defined in the `Iterator` trait and limits the iteration
to the first two items at most. The `ThreadPool` will go out of scope at the
end of `main`, and the `drop` implementation will run.

Start the server with `cargo run` and make three requests. The third request
should error, and in your terminal, you should see output similar to this:

<!-- manual-regeneration
cd listings/ch21-web-server/listing-21-25
cargo run
curl http://127.0.0.1:7878
curl http://127.0.0.1:7878
curl http://127.0.0.1:7878
third request will error because server will have shut down
copy output below
Can't automate because the output depends on making requests
-->

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Shutting down.
Shutting down worker 0
Worker 3 got a job; executing.
Worker 1 disconnected; shutting down.
Worker 2 disconnected; shutting down.
Worker 3 disconnected; shutting down.
Worker 0 disconnected; shutting down.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

You might see a different ordering of `Worker` IDs and messages printed. We can
see how this code works from the messages: `Worker` instances 0 and 3 got the
first two requests. The server stopped accepting connections after the second
connection, and the `Drop` implementation on `ThreadPool` starts executing
before `Worker 3` even starts its job. Dropping the `sender` disconnects all the
`Worker` instances and tells them to shut down. The `Worker` instances each
print a message when they disconnect, and then the thread pool calls `join` to
wait for each `Worker` thread to finish.

Notice one interesting aspect of this particular execution: The `ThreadPool`
dropped the `sender`, and before any `Worker` received an error, we tried to
join `Worker 0`. `Worker 0` had not yet gotten an error from `recv`, so the main
thread blocked, waiting for `Worker 0` to finish. In the meantime, `Worker 3`
received a job and then all threads received an error. When `Worker 0` finished,
the main thread waited for the rest of the `Worker` instances to finish. At that
point, they had all exited their loops and stopped.

Congrats! We’ve now completed our project; we have a basic web server that uses
a thread pool to respond asynchronously. We’re able to perform a graceful
shutdown of the server, which cleans up all the threads in the pool.

Here’s the full code for reference:

<span class="filename">نام فایل: src/main.rs</span>

```rust
use hello::ThreadPool;
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

<span class="filename">نام فایل: src/lib.rs</span>

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let message = receiver.lock().unwrap().recv();

                match message {
                    Ok(job) => {
                        println!("Worker {id} got a job; executing.");

                        job();
                    }
                    Err(_) => {
                        println!("Worker {id} disconnected; shutting down.");
                        break;
                    }
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

We could do more here! If you want to continue enhancing this project, here are
some ideas:

- Add more documentation to `ThreadPool` and its public methods.
- Add tests of the library’s functionality.
- Change calls to `unwrap` to more robust error handling.
- Use `ThreadPool` to perform some task other than serving web requests.
- Find a thread pool crate on [crates.io](https://crates.io/) and implement a
  similar web server using the crate instead. Then, compare its API and
  robustness to the thread pool we implemented.

## Summary

Well done! You’ve made it to the end of the book! We want to thank you for
joining us on this tour of Rust. You’re now ready to implement your own Rust
projects and help with other people’s projects. Keep in mind that there is a
welcoming community of other Rustaceans who would love to help you with any
challenges you encounter on your Rust journey.
