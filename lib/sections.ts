export type View =
  | "intro"
  | "home"
  | "myworld"
  | "projects"
  | "gallery"
  | "fun"
  | "chat";

export type SubView = Exclude<View, "intro" | "home">;

export type Direction = "forward" | "back";
