export interface CodeService {
  getUnlockCode(): Promise<string>;
  validate(code: string): Promise<boolean>;
}

/** Dev implementation. Swap for an API-backed one later without touching callers. */
export const codeService: CodeService = {
  async getUnlockCode() {
    return "INK-7F2A";
  },
  async validate(code: string) {
    return code.trim().toUpperCase() === (await this.getUnlockCode());
  },
};
