TODO:
* Implement UR logics
* Implement Bent subset logics, including
  - APE : Bent subset of rank 1
  - Sue-de-coq : Bent subset of rank 0
* Find a way to further classify the type of logic (such as discerning XY-wing, XYZ-wing, WXYZ-wing, W-wing, ALS, Simple Coloring, etc.)
* Improve visual representation of AIC logic. (In particular, implement link-type annotations.)
* Refactor the graphical notation.
* Implement Exocet
* Consider using WebAssembly (such as AssemblyScript) to improve speed.
* Make it frigging interactive! Darn it...


[Functionality]
The functionalities I need:

* Loops through the vertices.
  for (&v:V)
* Loops through the vertices in an edge.
  for (&v:V --<E>)
* Loops through the vertices joined from a given (set of) vertex by edges of the specified types.
  for (&v:V --Set<E~T>--> Set<V>)

* Loops through the edges.
  for (&e:E)
* Loops through the edges of the specified types.
  for (&e:E~T)
* Loops through the edges of the specified types incident to a given (set of) vertex.
  for (&e:E~T <-- Set<V>)
* Loops through the edges of the specified types incident to a given edge.
  for (&e:E~T -->*<-- e':E)
* Loops through subsets of sets of edges.
* Union of all vertices in the edges of an edge set.

* Systematically add vertices and edges to the a given puzzle. (Automatically updates the incidence structure.)
* Well-designed selector of a vertex, edge, ...





[Sudoku Puzzle Specification]

R1 = <1, [1, 9]>
R2 = <2, [1, 9]>




[Configuration Selector]

Q: Why do we need this?
A: To specify which type of configurations will be explored in the "compile" time.

Primitive selectors:
* RiCj = Cell at (i, j)
* RiVn = Row i with value n
* CjVn = Column j with value n
* BkVn = Box k with value n
* _i = i-th item in the permutation.

Operators:
* A & B = both A and B
* A | B = either A or B

Syntactic sugars:
* Ri = (RiC1 | ... | RiC9) | (RiV1 | ... | RiV9) // edges in Row i
* Cj = (R1Cj | ... | R9Cj) | (CjV1 | ... | CjV9) // edges in Column j
* Bk = [any cell in Bk] | (BkV1 | ... | BkV9) // edges in Box k
* Vn = (R1Vn | ... | R9Vn) | (C1Vn | ... | C9Vn) | (B1Vn | ... | B9Vn) // edges with value n



Examples:

Ri & Cj
= [(RiC1 | ... | RiC9) | (RiV1 | ... | RiV9)] & [(R1Cj | ... | R9Cj) | (CjV1 | ... | CjV9)]
= RiCj

(R_1 & (C_1|C_2)) | ((R_1|R_2|R_3) & C_1)
= R_1C_1 | R_1C_2 | R_2C_1 | R_3C_1

