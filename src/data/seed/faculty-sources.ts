import { type Field } from "@/types";

export type FacultySourceSeed = {
  universityName: string;
  field: Field;
  url: string;
  pageKind: "department_faculty" | "department_directory" | "subschool_faculty";
};

export const seededFacultySources: FacultySourceSeed[] = [
  {
    universityName: "Rutgers University",
    field: "Computer Science / AI",
    url: "https://www.cs.rutgers.edu/people/directory.php?type=faculty",
    pageKind: "department_faculty",
  },
  {
    universityName: "New Jersey Institute of Technology",
    field: "Computer Science / AI",
    url: "https://cs.njit.edu/faculty",
    pageKind: "department_faculty",
  },
  {
    universityName: "Stevens Institute of Technology",
    field: "Computer Science / AI",
    url: "https://www.stevens.edu/school-engineering-science/departments/computer-science/faculty",
    pageKind: "department_faculty",
  },
  {
    universityName: "Yale University",
    field: "Computer Science / AI",
    url: "https://engineering.yale.edu/academic-study/departments/computer-science/faculty",
    pageKind: "department_faculty",
  },
  {
    universityName: "Princeton University",
    field: "Computer Science / AI",
    url: "https://www.cs.princeton.edu/people/faculty",
    pageKind: "department_faculty",
  },
  {
    universityName: "Columbia University",
    field: "Computer Science / AI",
    url: "https://www.cs.columbia.edu/people/faculty/",
    pageKind: "department_faculty",
  },
  {
    universityName: "New York University",
    field: "Computer Science / AI",
    url: "https://cs.nyu.edu/dynamic/people/faculty/",
    pageKind: "department_faculty",
  },
  {
    universityName: "Massachusetts Institute of Technology",
    field: "Computer Science / AI",
    url: "https://www.csail.mit.edu/people?role=faculty",
    pageKind: "department_faculty",
  },
];

export function getSeededFacultySource(universityName: string, field: Field) {
  return seededFacultySources.find((seed) => seed.universityName === universityName && seed.field === field) ?? null;
}
