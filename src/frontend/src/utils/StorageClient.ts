/**
 * StorageClient stub — required by protected config.ts.
 * Not used in localStorage-only mode.
 */
export class StorageClient {
  private readonly _args: unknown[];

  constructor(...args: unknown[]) {
    this._args = args;
  }

  async putFile(
    _file: unknown,
    _onProgress?: unknown,
  ): Promise<{ hash: string }> {
    return { hash: "" };
  }

  async getDirectURL(_hash: string): Promise<string> {
    return "";
  }
}
