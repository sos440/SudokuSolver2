class Mother {
    static Child = class {
        constructor(value) {
            this.value = value;
        }
    }
    
    static children = Array.from({ length: 10 }).map((_, i) => new this.Child(i));
}