import wuDiff from "wu-diff-js";

type UpdateType = "added" | "removed" | "updated" | "replaced";
class UpdateGroup {
  constructor(
    public left: { min: number; length: number },
    public right: { min: number; length: number }
  ) {}
  get type(): UpdateType {
    if (!this.left) {
      return "added";
    }
    if (!this.right) {
      return "removed";
    }
    if (this.left.length === this.right.length) {
      return "updated";
    }
    return "replaced";
  }
}

export function diff(left: string[], right: string[]): UpdateGroup[] {
  const result = wuDiff(left, right);
  return groupDiffResult(result);
}

function groupDiffResult(result: any): UpdateGroup[] {
  let l = 0;
  let r = 0;
  let removed = 0;
  let added = 0;
  const groups: UpdateGroup[] = [];
  for (const res of result) {
    if (res.type === "added") {
      added++;
      r++;
    } else if (res.type === "removed") {
      removed++;
      l++;
    } else {
      addGroupIfNeeded();
      added = 0;
      removed = 0;
      l++;
      r++;
    }
  }
  addGroupIfNeeded();
  return groups;

  function addGroupIfNeeded() {
    let left;
    let right;
    if (removed) {
      left = { min: l - removed, length: removed };
    }
    if (added) {
      right = { min: r - added, length: added };
    }
    if (left || right) {
      groups.push(new UpdateGroup(left, right));
    }
  }
}
