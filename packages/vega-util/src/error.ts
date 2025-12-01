export default function error(message: string): never {
  throw Error(message);
}
