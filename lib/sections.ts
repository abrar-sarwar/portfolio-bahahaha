export type View = "intro" | "home" | "projects" | "organizations" | "fun";

export type SubView = Exclude<View, "intro" | "home">;

export type Direction = "forward" | "back";
