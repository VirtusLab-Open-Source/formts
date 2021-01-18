import { Atom } from "./atoms";
import { Lens } from "./lenses";

namespace ExampleUser {
  export type T = ReturnType<typeof mockVal>;

  export const mockVal = () => ({
    name: "Jan",
    age: 16,
    retirementAge: 100,
    addresses: [{ country: "PL", city: "KRK" }],
  });
}

describe("Atom", () => {
  describe("of", () => {
    it("Holds provided value", () => {
      const value = ExampleUser.mockVal();
      const atom = Atom.of(value);

      expect(atom.val).toBe(value);
    });

    it("allows for changing it's value", () => {
      const value1: ExampleUser.T = { ...ExampleUser.mockVal(), age: 30 };
      const value2: ExampleUser.T = { ...ExampleUser.mockVal(), age: 60 };

      const atom = Atom.of(value1);
      atom.set(value2);

      expect(atom.val).toBe(value2);
    });

    it("notifies subscribers on value change", () => {
      const value1: ExampleUser.T = { ...ExampleUser.mockVal(), age: 30 };
      const value2: ExampleUser.T = { ...ExampleUser.mockVal(), age: 60 };
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const atom = Atom.of(value1);

      atom.subscribe(sub1);
      atom.subscribe(sub2);

      expect(sub1).not.toHaveBeenCalled();
      expect(sub2).not.toHaveBeenCalled();

      atom.set(value2);

      expect(sub1).toHaveBeenCalledWith(value2);
      expect(sub2).toHaveBeenCalledWith(value2);
    });

    it("does not notify subscribers on redundant value change", () => {
      const value1: ExampleUser.T = { ...ExampleUser.mockVal(), age: 30 };
      const value2: ExampleUser.T = { ...ExampleUser.mockVal(), age: 60 };
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const atom = Atom.of(value1);

      atom.subscribe(sub1);
      atom.subscribe(sub2);

      expect(sub1).not.toHaveBeenCalled();
      expect(sub2).not.toHaveBeenCalled();

      atom.set(value1);

      expect(sub1).not.toHaveBeenCalled();
      expect(sub2).not.toHaveBeenCalled();

      atom.set(value2);

      expect(sub1).toHaveBeenCalledWith(value2);
      expect(sub2).toHaveBeenCalledWith(value2);
    });

    it("allows for unsubscribing", () => {
      const value1: ExampleUser.T = { ...ExampleUser.mockVal(), age: 30 };
      const value2: ExampleUser.T = { ...ExampleUser.mockVal(), age: 60 };
      const sub1 = jest.fn();
      const sub2 = jest.fn();

      const atom = Atom.of(value1);

      const sub1Key = atom.subscribe(sub1);
      const sub2Key = atom.subscribe(sub2);

      expect(sub1).toHaveBeenCalledTimes(0);
      expect(sub2).toHaveBeenCalledTimes(0);

      atom.set(value2);

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(1);

      atom.unsubscribe(sub1Key);
      atom.set(value1);

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(2);

      atom.unsubscribe(sub2Key);
      atom.set(value2);

      expect(sub1).toHaveBeenCalledTimes(1);
      expect(sub2).toHaveBeenCalledTimes(2);
    });
  });

  describe("entangle", () => {
    it("Holds value obtained via Lens getter", () => {
      const user = ExampleUser.mockVal();
      const userAtom = Atom.of(user);
      const firstCountryAtom = Atom.entangle(
        userAtom,
        Lens.compose(
          Lens.prop("addresses"),
          Lens.index(0),
          Lens.prop("country")
        )
      );

      expect(firstCountryAtom.val).toBe("PL");
    });

    it("Holds value which reflects current value of source atom", () => {
      const user1 = ExampleUser.mockVal();
      const user2: ExampleUser.T = {
        ...ExampleUser.mockVal(),
        addresses: [{ city: "LON", country: "UK" }],
      };
      const user3: ExampleUser.T = { ...ExampleUser.mockVal(), addresses: [] };

      const userAtom = Atom.of(user1);
      const firstCountryAtom = Atom.entangle(
        userAtom,
        Lens.compose(
          Lens.prop("addresses"),
          Lens.index(0),
          Lens.prop("country")
        )
      );

      expect(firstCountryAtom.val).toBe("PL");

      userAtom.set(user2);
      expect(firstCountryAtom.val).toBe("UK");

      userAtom.set(user3);
      expect(firstCountryAtom.val).toBe(undefined);
    });

    it("Notifies it's subscribers on relevant source atom changes", () => {
      const user1 = ExampleUser.mockVal();
      const user2: ExampleUser.T = {
        ...ExampleUser.mockVal(),
        retirementAge: user1.retirementAge + 20,
      };
      const user3: ExampleUser.T = {
        ...ExampleUser.mockVal(),
        age: user1.age + 10,
      };
      const sub = jest.fn();

      const userAtom = Atom.of(user1);
      const userAgeAtom = Atom.entangle(userAtom, Lens.prop("age"));

      userAgeAtom.subscribe(sub);
      expect(sub).not.toHaveBeenCalled();

      userAtom.set(user2);
      expect(sub).not.toHaveBeenCalled();

      userAtom.set(user3);
      expect(sub).toHaveBeenCalledWith(user3.age);
    });

    it("Allows for setting it's value", () => {
      const user: ExampleUser.T = { ...ExampleUser.mockVal(), name: "Foo" };

      const userAtom = Atom.of(user);
      const userNameAtom = Atom.entangle(userAtom, Lens.prop("name"));

      expect(userNameAtom.val).toBe("Foo");

      userNameAtom.set("Bar");
      expect(userNameAtom.val).toBe("Bar");
    });

    it("Source atom value reflects change to it's value", () => {
      const user: ExampleUser.T = { ...ExampleUser.mockVal(), name: "Foo" };

      const userAtom = Atom.of(user);
      const userNameAtom = Atom.entangle(userAtom, Lens.prop("name"));

      expect(userAtom.val.name).toBe("Foo");

      userNameAtom.set("Bar");

      expect(userAtom.val).not.toBe(user);
      expect(userAtom.val.name).toBe("Bar");
    });

    it("Notifies it's subscribers when it's value changes", () => {
      const user: ExampleUser.T = { ...ExampleUser.mockVal(), name: "Foo" };

      const userAtom = Atom.of(user);
      const userNameAtom = Atom.entangle(userAtom, Lens.prop("name"));

      const sub = jest.fn();
      userNameAtom.subscribe(sub);

      expect(sub).toHaveBeenCalledTimes(0);
      expect(sub).not.toHaveBeenCalled();

      userNameAtom.set("Bar");
      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenCalledWith("Bar");

      userAtom.set({ ...userAtom.val, name: "Baz" });
      expect(sub).toHaveBeenCalledTimes(2);
      expect(sub).toHaveBeenCalledWith("Baz");

      userAtom.set({ ...userAtom.val, age: 100 });
      expect(sub).toHaveBeenCalledTimes(2);
    });

    it("is composable", () => {
      const userAtom = Atom.of(ExampleUser.mockVal());
      const addressAtom = Atom.entangle(
        userAtom,
        Lens.compose(Lens.prop("addresses"), Lens.index(0))
      );
      const cityAtom = Atom.entangle(addressAtom, Lens.prop("city"));

      expect(cityAtom.val).toBe("KRK");

      cityAtom.set("WRS");

      expect(cityAtom.val).toBe("WRS");
      expect(addressAtom.val?.city).toBe("WRS");
      expect(userAtom.val.addresses[0].city).toBe("WRS");

      userAtom.set({
        ...userAtom.val,
        addresses: [{ city: "GDA", country: "PL" }],
      });

      expect(cityAtom.val).toBe("GDA");
      expect(addressAtom.val?.city).toBe("GDA");
      expect(userAtom.val.addresses[0].city).toBe("GDA");
    });
  });

  describe("fuse", () => {
    describe("holds value computed from other atoms", () => {
      const a = Atom.of(1);
      const b = Atom.of(3);
      const c = Atom.of(5);
      const formula = (a: number, b: number, c: number) => a ** b + c;

      const fused = Atom.fuse(formula, a, b, c);

      expect(fused.val).toEqual(formula(1, 3, 5));

      a.set(2);
      expect(fused.val).toEqual(formula(2, 3, 5));

      b.set(5);
      expect(fused.val).toEqual(formula(2, 5, 5));

      c.set(20);
      expect(fused.val).toEqual(formula(2, 5, 20));
    });

    describe("Notifies it's subscribers when it's value changes", () => {
      const a = Atom.of(1);
      const b = Atom.of(3);
      const c = Atom.of(5);
      const formula = (a: number, b: number, c: number) => a ** b + c;

      const fused = Atom.fuse(formula, a, b, c);
      const sub = jest.fn();
      fused.subscribe(sub);

      expect(sub).toHaveBeenCalledTimes(0);

      a.set(2);
      expect(sub).toHaveBeenCalledTimes(1);
      expect(sub).toHaveBeenCalledWith(formula(2, 3, 5));

      b.set(5);
      expect(sub).toHaveBeenCalledTimes(2);
      expect(sub).toHaveBeenCalledWith(formula(2, 5, 5));

      c.set(20);
      expect(sub).toHaveBeenCalledTimes(3);
      expect(sub).toHaveBeenCalledWith(formula(2, 5, 20));
    });
  });
});
