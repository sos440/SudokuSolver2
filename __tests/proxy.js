const target = {
    message1: "hello",
    message2: "everyone"
};

const handler2 = {
    get(target, prop, receiver) {
        if (prop == 'message1'){
            return "world";
        }
        else {
            return Reflect.get(...arguments);
        }
    }
};

const proxy2 = new Proxy(target, handler2);

console.log(proxy2.message1); // world
console.log(proxy2.message2); // world