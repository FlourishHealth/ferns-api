// Defaults closed
import {PermissionMethod, RESTMethod, User} from "./api";

export const OwnerQueryFilter = (user?: User) => {
  if (user) {
    return {ownerId: user?.id};
  }
  // Return a null, so we know to return no results.
  return null;
};

export const Permissions = {
  IsAuthenticatedOrReadOnly: (method: RESTMethod, user?: User) => {
    if (user?.id && !user?.isAnonymous) {
      return true;
    }
    return method === "list" || method === "read";
  },
  IsOwnerOrReadOnly: (method: RESTMethod, user?: User, obj?: any) => {
    // When checking if we can possibly perform the action, return true.
    if (!obj) {
      return true;
    }
    if (user?.admin) {
      return true;
    }

    if (user?.id && obj?.ownerId && String(obj?.ownerId) === String(user?.id)) {
      return true;
    }
    return method === "list" || method === "read";
  },
  IsAny: () => {
    return true;
  },
  IsOwner: (method: RESTMethod, user?: User, obj?: any) => {
    // When checking if we can possibly perform the action, return true.
    if (!obj) {
      return true;
    }
    if (!user) {
      return false;
    }
    if (user?.admin) {
      return true;
    }
    return user?.id && obj?.ownerId && String(obj?.ownerId) === String(user?.id);
  },
  IsAdmin: (method: RESTMethod, user?: User) => {
    return Boolean(user?.admin);
  },
  IsAuthenticated: (method: RESTMethod, user?: User) => {
    if (!user) {
      return false;
    }
    return Boolean(user.id);
  },
};

export async function checkPermissions<T>(
  method: RESTMethod,
  permissions: PermissionMethod<T>[],
  user?: User,
  obj?: T
): Promise<boolean> {
  let anyTrue = false;
  for (const perm of permissions) {
    // May or may not be a promise.
    if (!(await perm(method, user, obj))) {
      return false;
    } else {
      anyTrue = true;
    }
  }
  return anyTrue;
}
