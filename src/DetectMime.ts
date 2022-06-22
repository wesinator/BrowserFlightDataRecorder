class DetectMime {
    private _data: Blob;
    constructor(data: Blob) {
        this._data = data;
    }

    async detectAsync(): Promise<string> {
        const magicNumbers: Map<string, string> = new Map([
            ["89504E47", "image/png"],
            ["FFD8DDE0", "image/jpeg"],
            ["FFD8FFEE", "image/jpeg"],
            ["474946383961", "image/gif"],
            ["474946383761", "image/gif"]
        ]);

        const ui8s = new Uint8Array(await this._data.arrayBuffer());
        let header = "";
        for (let i = 0; i < 10; i++) {
            header += ui8s[i].toString(16);
        }
        for (let mn of magicNumbers) {
            if (header.startsWith(mn[0])) {
                return mn[1];
            }
        }
        throw new Error("MIME cannot be detected.");
    }
}