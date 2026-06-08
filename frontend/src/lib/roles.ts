import type { Role } from "../types/domain";

export function labelForRole(role: Role): string {
  switch (role) {
    case "ministryLeader":
      return "Ministry Leader";
    case "btLeader":
      return "Bible-Talk Leader";
    case "member":
      return "Member";
  }
}

/** Human-readable description of what data a given role can see. */
export function labelForScope(role: Role): string {
  switch (role) {
    case "ministryLeader":
      return "All campuses";
    case "btLeader":
      return "Your campus";
    case "member":
      return "Your bible talk";
  }
}
