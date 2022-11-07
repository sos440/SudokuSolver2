class Test {
    static make (){
        /** Does 'this' refers to the class? */
        return new this();
    }

    toString (){
        return 'I am a test!';
    }
}

console.log(Test.make().toString());