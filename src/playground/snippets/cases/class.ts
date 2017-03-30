function num(): number { return 1 };

interface X {
  g: string;
}

interface Y {
  imeth();
}

abstract class AbstractTest implements X, Y {

  public abstract g: string = 'g';

  imeth(): void {

  }

}

class BaseTest extends AbstractTest {

  public x: number;
  public static y: string = 'a';
  public g: string;

}

class Test extends BaseTest {

  public static a = num();
  public static b: string = 'str';

  public c: number[];
  public d: string[] = ['str'];

  constructor() {
    super();
  }

  protected static method(param1: string, param2?: number): number {
    return 0;
  }

  private [CompProp.a](): void {

  }

}
