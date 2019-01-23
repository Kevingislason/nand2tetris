// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)

// Put your code here.

@R2
M = 0

(LOOP)

//Load first number into D
@R0
D = M

//If D == 0, Jump to end
@END
D;JEQ

//Load second number into D
@R1
D = M

//Total += second number
@R2
M = D + M

//Decrement first number
@R0
M = M - 1

//Jump to start of loop
@LOOP
0;JMP

(END)

@END
0;JMP
