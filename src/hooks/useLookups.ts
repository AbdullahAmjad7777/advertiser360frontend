import { useEffect, useState } from "react";
import * as lookupsApi from "@/api/lookups";
import type { Department, Designation, RoleOption } from "@/types";

export function useLookups() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      lookupsApi.fetchDepartments(),
      lookupsApi.fetchDesignations(),
      lookupsApi.fetchRoles(),
    ])
      .then(([d, des, r]) => {
        if (cancelled) return;
        setDepartments(d);
        setDesignations(des);
        setRoles(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { departments, designations, roles, loading };
}
