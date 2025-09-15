const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');

const controller = {};

const SOURCE_FILE = path.join(
    path.join(__dirname, '../public/data/BVBRC_100.jsonl')
);

function makePredicate(queryStringList) {
    const predicate = queryStringList.reduce(
        (acc, { family, genus, species }) => {
            acc[family.toLowerCase()] ??= {};
            acc[family.toLowerCase()][genus.toLowerCase()] ??= new Set();
            acc[family.toLowerCase()][genus.toLowerCase()].add(
                species.toLowerCase()
            );
            return acc;
        },
        {}
    );
    return predicate;
}

controller.getData = async function (req, res) {
    queryString = req.body;

    let rows = [];
    const input = fs.createReadStream(SOURCE_FILE, { encoding: 'utf8' });
    const rl = readline.createInterface({ input, crlfDelay: Infinity });
    const predicate = makePredicate(queryString);
    const tryRow = (row, predicate) => {
        if (Object.hasOwn(predicate, row.family.toLowerCase())) {
            if (
                Object.hasOwn(
                    predicate[row.family.toLowerCase()],
                    row.genus.toLowerCase()
                )
            ) {
                if (
                    predicate[row.family.toLowerCase()][
                        row.genus.toLowerCase()
                    ].has(row.species.toLowerCase())
                ) {
                    return true;
                }
            }
        }
        return false;
    };

    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            const obj = JSON.parse(trimmed);
            if (tryRow(obj, predicate)) {
                rows.push(obj);
            }
        } catch {
            // skip malformed lines
        }
    }

    return rows;
};

module.exports = controller;
