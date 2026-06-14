export type View =
  | "intro"
  | "home"
  | "myworld"
  | "projects"
  | "organizations"
  | "fun";

export type SubView = Exclude<View, "intro" | "home">;

export type Direction = "forward" | "back";
