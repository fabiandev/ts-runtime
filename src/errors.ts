export class ProgramError extends Error {

  public static id = 'ProgramError';

  constructor(public message: string) {
      super(message);
      this.name = ProgramError.id;
    }
}
