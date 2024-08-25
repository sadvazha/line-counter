# line-counter

Line printer prints the given line from a file

Line printer create an index file during the first run and then prints the given line from a file using this index file in O(1).

Usage (this run is made on a utf-8 encoded text file of size 1.5G):
```
  ➜  line_printer$ DEBUG=true npm run start tmp.txt 1000003

  > line_printer@1.0.0 start
  > node dist/index.js tmp.txt 1000003

  Index file created
  line:0001000003
  Execution time: 42360ms

  ➜  line_printer$ DEBUG=true npm run start tmp.txt 1000003

  > line_printer@1.0.0 start
  > node dist/index.js tmp.txt 1000003

  line:0001000003
  Execution time: 10ms

  ➜  line_printer$ DEBUG=true npm run start tmp.txt 10000034

  > line_printer@1.0.0 start
  > node dist/index.js tmp.txt 10000034

  line:0010000034
  Execution time: 9ms
```

Note: about `tmp.txt` file, it was created using node REPL:
```
for (let i = 0; i < 1e9 ; i++) { fs.appendFileSync('./tmp.txt', `line:${i.toString().padStart(10, '0')}\n`) }
```
I stopped execution after some time, since i was running out of space on my PC, so exit file was around 1e8 lines

Limitations:
- Supports only UTF-8 encoding
- Tested only on Unix-style line endings
- Will use the same index for the file with the same name
- Does not know when file was updated and will not update the index file
- Some race conditions are not handled

Possible improvements:
- Handle different encodings
- Test diffferent line endings
- Improve index file structure (it shouldn't be this big)
- Track file to idx
- Indexes don't need to be create for each line, this should be configurable
- ...