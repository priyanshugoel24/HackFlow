export interface Project {
  id: string;
  name: string;
  createdById: string;
  members: Array<{
    userId: string;
    role: "MANAGER" | "MEMBER";
    status: "ACTIVE" | "PENDING";
  }>;
}

export default Project;