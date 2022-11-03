/**
 * Test iterator protocol
 */

const arr = new Uint32Array(Array.from({ length: 10 }).map((_, i) => i ** 2));

const iter = {
    i: 0,
    j: 0,
    next: function () {
        this.j++;
        if (this.j >= arr.length){
            this.i++;
            this.j = 0;
        }
        if (this.i >= arr.length){
            return { done : true };
        }
        else {
            return { done : false, value : [this.i, this.j] };
        }
    },
    return: function (){
        this.i = 0;
        this.j = 0;
    }
};

let c = 0;

iter.return();
while (true) {
    const res = iter.next();
    if (res.done){
        break;
    }
    c += arr[res.value[0]] + arr[res.value[1]];
    console.log(`${res.value[0]}, ${res.value[1]}`);
}