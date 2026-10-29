import { hostOf, parseHost } from "./favicon";

test("parseHost accepts hostnames only", () => {
  expect(parseHost("nublson.com")).toBe("nublson.com");
  expect(parseHost(" Notionic.DEV ")).toBe("notionic.dev");
  expect(parseHost("localhost")).toBeNull();
  expect(parseHost("example.com/path")).toBeNull();
  expect(parseHost("http://example.com")).toBeNull();
  expect(parseHost("-bad.com")).toBeNull();
  expect(parseHost("")).toBeNull();
  expect(parseHost(null)).toBeNull();
});

test("hostOf reads absolute http(s) URLs", () => {
  expect(hostOf("https://nublson.com/about?x=1")).toBe("nublson.com");
  expect(hostOf("/introduction")).toBeNull();
  expect(hostOf("mailto:hi@example.com")).toBeNull();
});
