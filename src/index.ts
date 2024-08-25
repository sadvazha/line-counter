import * as fs from 'fs';
import * as readline from 'readline';

// By task definition
const FILE_LINES_MAX = 1e9;
// By task definition
const FILE_LENGTH_MAX = 1e3;
// In UTF-8 one character can vary between 1-4 bytes
const CHARACTER_SIZE_MAX = 4;
// Max file size in bytes
const FILE_SIZE_MAX = FILE_LINES_MAX * FILE_LENGTH_MAX * CHARACTER_SIZE_MAX;
// Max length of byte integer representation (required for padding indices)
const MAX_FILE_BYTE_LENGTH = FILE_SIZE_MAX.toString().length;

// Disable debug logs for real runs (we could've used logger, but why add dep for this small app? :D)
if (!process.env.DEBUG) {
    console.debug = () => { }
}

/**
 * Creates index file, that will allow us to find line start in O(1) time, though creation is O(n)
 * Also index file can get bigger than the original file, we could've saved every x lines and then start search from there
 *
 * @param filePath path of file to index
 * @param indexPath path to new file that we will use for indexing
 */
async function createIndexFile(filePath: string, indexPath: string): Promise<void> {
    const inputFileStream = fs.createReadStream(filePath);
    const indexFileStream = fs.createWriteStream(indexPath, { flags: 'w' });
    const rl = readline.createInterface({
        input: inputFileStream,
        crlfDelay: Infinity
    });
    try {
        let currentOffset = 0;

        // Read line, add size of line to the output
        for await (const line of rl) {
            const paddedOffset = currentOffset.toString().padStart(MAX_FILE_BYTE_LENGTH, '0');
            indexFileStream.write(paddedOffset + '\n');
            currentOffset += Buffer.byteLength(line, 'utf8') + 1;  // +1 for the newline character
        }

        indexFileStream.end();
        console.debug('Index file created');
    } finally {
        rl.close()
        indexFileStream.close();
        inputFileStream.close();
    }
}

/**
 *
 * @param path e.g. /path/to/file
 * @param start bytes
 */
async function _getLine(path: string, start: number): Promise<string> {
    const fileStream = fs.createReadStream(path, { start });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    try {
        const line = await rl[Symbol.asyncIterator]().next();
        return line.value
    } finally {
        rl.close()
        fileStream.close()
    }
}

async function getLine(filePath: string, indexPath: string, lineNumber: number): Promise<string> {
    const lineOffsetSize = MAX_FILE_BYTE_LENGTH + 1; // index file lineLength + newline character
    const indexPosition = lineNumber * lineOffsetSize;

    const startFrom = await _getLine(indexPath, indexPosition)
    if (!startFrom) {
        throw new Error(`Line ${lineNumber} not found in index file, possibly length exceeding file`)
    }

    return _getLine(filePath, parseInt(startFrom, 10))
}



async function main() {
    const start = new Date()
    const [filePath, lineStr] = process.argv.slice(2);
    if (!filePath || !lineStr) {
        throw new Error('Please provide file path and line number');
    }

    if (!fs.existsSync(filePath)) {
        throw new Error(`File ${filePath} does not exist`);
    }
    const lineNumber = parseInt(lineStr, 10);
    const indexPath = `${filePath}.idx`;

    // Possible race condition, but for now, we don't want to mess with locks
    if (!fs.existsSync(indexPath)) {
        await createIndexFile(filePath, indexPath);
    }

    try {
        const line = await getLine(filePath, indexPath, lineNumber);
        // Output to stdout
        console.info(line);
    } catch (err) {
        console.error(err);
    }

    console.debug('Execution time: %dms', new Date().getTime() - start.getTime());
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
