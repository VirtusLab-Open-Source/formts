import { Atom, Molecule } from "./atomv2";

describe("atoms v2", () => {
  describe("Atom", () => {
    it("holds provided initial value", () => {
      const value = { foo: "bar" };
      const atom = Atom(value);
      expect(atom.val).toBe(value);
    });

    it("allows for changing its value", () => {
      const atom = Atom(1);
      atom.set(2);

      expect(atom.val).toBe(2);
    });

    it("notifies subscribers when value is changed", () => {
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const atom = Atom(1);
      atom.subscribe(sub1);
      atom.subscribe(sub2);

      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      atom.set(2);
      atom.set(2);
      atom.set(3);

      expect(sub1).toHaveBeenCalledTimes(2);
      expect(sub2).toHaveBeenCalledTimes(2);
    });

    it("allows for unsubscribing from notifications", () => {
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const atom = Atom(1);
      const sub1Key = atom.subscribe(sub1);
      const sub2Key = atom.subscribe(sub2);

      atom.set(2);
      atom.set(2);
      atom.unsubscribe(sub1Key);
      atom.set(3);
      atom.unsubscribe(sub2Key);
      atom.set(4);

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(2);
    });
  });

  describe("Molecule", () => {
    it("composes values from several atoms", () => {
      const name = Atom("Joe");
      const email = Atom("some@mail.com");
      const age = Atom(22);

      const person = Molecule({ name, email, age });

      expect(person.val).toEqual({
        name: "Joe",
        email: "some@mail.com",
        age: 22,
      });
    });

    it("value is referentially stable until change", () => {
      const name = Atom("Joe");
      const email = Atom("some@mail.com");
      const age = Atom(22);

      const person = Molecule({ name, email, age });

      const val1 = person.val;
      const val2 = person.val;
      age.set(23);
      const val3 = person.val;

      expect(val1 === val2).toBeTruthy();
      expect(val2 === val3).toBeFalsy();
    });

    it("allows for changing its value", () => {
      const name = Atom("Joe");
      const email = Atom("some@mail.com");
      const age = Atom(22);

      const person = Molecule({ name, email, age });

      person.set({
        name: "John",
        email: email.val,
        age: age.val * 2,
      });

      expect(person.val).toEqual({
        name: "John",
        email: "some@mail.com",
        age: 44,
      });

      expect(name.val).toBe("John");
      expect(email.val).toBe("some@mail.com");
      expect(age.val).toBe(44);
    });

    it("notifies subscribers when value is changed", () => {
      const atomA = Atom("a");
      const atomB = Atom("b");
      const molecule = Molecule({ a: atomA, b: atomB });

      const subA = jest.fn();
      const subB = jest.fn();
      const subM = jest.fn();

      atomA.subscribe(subA);
      atomB.subscribe(subB);
      molecule.subscribe(subM);

      expect(subA).toHaveBeenCalledTimes(0);
      expect(subB).toHaveBeenCalledTimes(0);
      expect(subM).toHaveBeenCalledTimes(0);

      atomA.set("aa");
      expect(subA).toHaveBeenCalledTimes(1);
      expect(subB).toHaveBeenCalledTimes(0);
      expect(subM).toHaveBeenCalledTimes(1);

      molecule.set({ a: "aaa", b: "bb" });
      expect(subA).toHaveBeenCalledTimes(2);
      expect(subB).toHaveBeenCalledTimes(1);
      expect(subM).toHaveBeenCalledTimes(3);

      molecule.set({ a: "aaa", b: "bb" });
      expect(subA).toHaveBeenCalledTimes(2);
      expect(subB).toHaveBeenCalledTimes(1);
      expect(subM).toHaveBeenCalledTimes(3);
    });

    it("allows for unsubscribing from notifications", () => {
      const atomA = Atom("a");
      const atomB = Atom("b");
      const molecule = Molecule({ a: atomA, b: atomB });

      const sub1 = jest.fn();
      const sub2 = jest.fn();
      const unsubscribeKey1 = molecule.subscribe(sub1);
      const unsubscribeKey2 = molecule.subscribe(sub2);

      molecule.set({ a: "aa", b: "bb" });
      expect(sub1).toHaveBeenCalledTimes(2);
      expect(sub2).toHaveBeenCalledTimes(2);

      molecule.unsubscribe(unsubscribeKey1);
      molecule.set({ a: "aaa", b: "bbb" });
      expect(sub1).toHaveBeenCalledTimes(2);
      expect(sub2).toHaveBeenCalledTimes(4);

      molecule.unsubscribe(unsubscribeKey2);
      molecule.set({ a: "aaaa", b: "bbbb" });
      expect(sub1).toHaveBeenCalledTimes(2);
      expect(sub2).toHaveBeenCalledTimes(4);
    });
  });

  describe("molecule tree", () => {
    const getTree = () => {
      /*
                   root
               l         r
            l1   l2   r1   r2
      */
      const l1 = Atom("l1");
      const l2 = Atom("l2");
      const r1 = Atom("r1");
      const r2 = Atom("r2");

      const l = Molecule({ l1, l2 });
      const r = Molecule({ r1, r2 });

      const root = Molecule({ l, r });

      return { l1, l2, r1, r2, l, r, root };
    };

    it("composes values from several molecules", () => {
      const tree = getTree();

      expect(tree.root.val).toEqual({
        l: { l1: "l1", l2: "l2" },
        r: { r1: "r1", r2: "r2" },
      });
      expect(tree.l.val).toEqual({ l1: "l1", l2: "l2" });
      expect(tree.r.val).toEqual({ r1: "r1", r2: "r2" });
    });

    it("values are referentially stable until change", () => {
      const tree = getTree();

      const rootVal1 = tree.root.val;
      const lVal1 = tree.l.val;
      const rVal1 = tree.r.val;

      const rootVal2 = tree.root.val;
      const lVal2 = tree.l.val;
      const rVal2 = tree.r.val;

      tree.l.set({ l1: "l1+", l2: "l2+" });
      const rootVal3 = tree.root.val;
      const lVal3 = tree.l.val;
      const rVal3 = tree.r.val;

      tree.r2.set("r2+");
      const rootVal4 = tree.root.val;
      const lVal4 = tree.l.val;
      const rVal4 = tree.r.val;

      expect(rootVal1 === rootVal2).toBeTruthy();
      expect(rootVal2 === rootVal3).toBeFalsy();
      expect(rootVal3 === rootVal4).toBeFalsy();

      expect(lVal1 === lVal2).toBeTruthy();
      expect(lVal2 === lVal3).toBeFalsy();
      expect(lVal3 === lVal4).toBeTruthy();

      expect(rVal1 === rVal2).toBeTruthy();
      expect(rVal2 === rVal3).toBeTruthy();
      expect(rVal3 === rVal4).toBeFalsy();
    });
  });
});
