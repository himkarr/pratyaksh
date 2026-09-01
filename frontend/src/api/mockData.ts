import projects from "../../../contracts/sample-data/sample_projects.json";
import flags from "../../../contracts/sample-data/sample_flags.json";
import users from "../../../contracts/sample-data/sample_users.json";
export { projects, flags, users };
export type Project = (typeof projects)[number];
export type Flag = (typeof flags)[number];
