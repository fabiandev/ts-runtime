export default function createWorker() {
  return new Worker(new URL('./worker', import.meta.url));
}
