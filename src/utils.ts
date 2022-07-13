import {ObjectId} from "mongodb";

// A better version of mongoose's ObjectId.isValid, which falsely will say any 12 character string is valid.
export function isValidObjectId(id: string): boolean {
  try {
    return new ObjectId(id).toString() === id;
  } catch (e) {
    return false;
  }
}
