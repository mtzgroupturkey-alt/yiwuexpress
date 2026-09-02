import { describe, it, expect } from 'vitest';
import {
  validateBranchName,
  validateCommitMessage,
  validateFilePaths,
  validateCommitHash,
} from '../lib/deploy/git';

describe('git.ts security validations', () => {
  describe('validateBranchName', () => {
    it('accepts valid standard branch names', () => {
      expect(validateBranchName('main')).toBe('main');
      expect(validateBranchName('production')).toBe('production');
      expect(validateBranchName('feature/login-fix')).toBe('feature/login-fix');
      expect(validateBranchName('release-1.2.0')).toBe('release-1.2.0');
      expect(validateBranchName('fix_issue_123')).toBe('fix_issue_123');
    });

    it('rejects flag injection attempts (starting with hyphen)', () => {
      expect(() => validateBranchName('--upload-pack=calc.exe')).toThrow(
        /flag injection/i
      );
      expect(() => validateBranchName('-b')).toThrow(/flag injection/i);
      expect(() => validateBranchName('--exec=rm -rf /')).toThrow(/flag injection/i);
    });

    it('rejects command injection characters and shell operators', () => {
      expect(() => validateBranchName('main; rm -rf /')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main && whoami')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main | cat /etc/passwd')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main`id`')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main$(id)')).toThrow(/Invalid branch name/i);
    });

    it('rejects invalid git ref characters', () => {
      expect(() => validateBranchName('main..origin')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main~1')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main^2')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main:branch')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main?')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main*')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main[0]')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main\\sub')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main@{1}')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main/')).toThrow(/Invalid branch name/i);
      expect(() => validateBranchName('main.')).toThrow(/Invalid branch name/i);
    });

    it('rejects empty or non-string branch names', () => {
      expect(() => validateBranchName('')).toThrow(/cannot be empty/i);
      expect(() => validateBranchName('   ')).toThrow(/cannot be empty/i);
      expect(() => validateBranchName(null as any)).toThrow(/must be a string/i);
      expect(() => validateBranchName(undefined as any)).toThrow(/must be a string/i);
    });
  });

  describe('validateCommitMessage', () => {
    it('accepts valid commit messages', () => {
      expect(validateCommitMessage('feat: add user profile page')).toBe(
        'feat: add user profile page'
      );
      expect(validateCommitMessage('fix(auth): resolve JWT expiration\n\nCloses #42')).toBe(
        'fix(auth): resolve JWT expiration\n\nCloses #42'
      );
    });

    it('strips null bytes', () => {
      expect(validateCommitMessage('normal message\0malicious code')).toBe(
        'normal messagemalicious code'
      );
    });

    it('rejects empty messages', () => {
      expect(() => validateCommitMessage('')).toThrow(/cannot be empty/i);
      expect(() => validateCommitMessage('   \n\t  ')).toThrow(/cannot be empty/i);
    });

    it('rejects messages exceeding 10,000 characters', () => {
      const hugeMessage = 'a'.repeat(10001);
      expect(() => validateCommitMessage(hugeMessage)).toThrow(/exceeds maximum length/i);
    });
  });

  describe('validateFilePaths', () => {
    it('accepts valid relative file paths', () => {
      const files = ['src/index.ts', 'components/Button.tsx', 'lib/utils.ts'];
      expect(validateFilePaths(files)).toEqual(files);
    });

    it('rejects CLI flags passed as file paths', () => {
      expect(() => validateFilePaths(['--all'])).toThrow(/flag injection/i);
      expect(() => validateFilePaths(['src/index.ts', '-f'])).toThrow(/flag injection/i);
    });

    it('rejects empty or invalid file lists', () => {
      expect(() => validateFilePaths('not-an-array' as any)).toThrow(/must be an array/i);
      expect(() => validateFilePaths([''])).toThrow(/cannot be empty/i);
    });
  });

  describe('validateCommitHash', () => {
    it('accepts valid short and full SHA-1 / SHA-256 hashes', () => {
      expect(validateCommitHash('de5c1ee')).toBe('de5c1ee');
      expect(validateCommitHash('184a845199ff9d0c2e92c2125f493b890a8801d9')).toBe(
        '184a845199ff9d0c2e92c2125f493b890a8801d9'
      );
    });

    it('rejects non-hex characters and injection payloads', () => {
      expect(() => validateCommitHash('HEAD; rm -rf /')).toThrow(/Invalid commit hash/i);
      expect(() => validateCommitHash('not-a-hash')).toThrow(/Invalid commit hash/i);
      expect(() => validateCommitHash('abc')).toThrow(/Invalid commit hash/i);
    });
  });
});
