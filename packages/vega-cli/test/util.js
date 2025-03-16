import { exec } from 'child_process';
import pngjs from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync } from 'fs';
import { deleteAsync } from 'del';

const PNG = pngjs.PNG;
const res = 'test/resources/';
const GENERATE = false;

export default (function test(t, cmd, file, png = false) {
    const output = GENERATE ? res + file : file;
    exec(`${cmd} ${output}`, error => {
        if (error)
            t.fail(error);
        if (!GENERATE) {
            const expectImg = readFileSync(res + file);
            const actualImg = readFileSync(output);
            if (png) {
                const expect = PNG.sync.read(expectImg);
                const actual = PNG.sync.read(actualImg);
                const { width, height } = expect;
                t.equal(pixelmatch(actual.data, expect.data, null, width, height, { threshold: 0 }), 0);
            }
            else {
                t.ok(expectImg.equals(actualImg));
            }
            deleteAsync(output).catch(error => t.fail(error));
        }
        t.end();
    });
});
