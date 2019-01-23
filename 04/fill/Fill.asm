// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed.
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.

//Store the size of the screen
@8192
D = A
@screensize
M = D




//This is our main event loop; based on state of keyboard,
(LOOP)
//Stores whether or not the keyboard is pressed in D
@KBD
D = M

@keyboardStatus
M = D

//Based on D, blacken or whiten
@FILL
0;JMP

//Begin loop again
@LOOP
0;JMP

(END)



//This code blackens/whitens the whole screen
(FILL)

@counter
M = 0

(LOOP2)

//Store counter in D
@counter
D = M

//Store counter + screen in A
@SCREEN
D = D + A

//This is the address of the pixel we want to update in a sec
@pixelPointer
M = D

//Store keyboard status in D
@keyboardStatus
D = -M

//This is where we update the screen based on keyboard status
@pixelPointer
A = M
M = D

//Increment counter (R1)
@counter
M = M + 1

//If counter (R1) < screensize - 1, jump to the start of LOOP2
D = M
@screensize

//We loop if screensize - counter - 1 > 0
D = M - D
@LOOP2
D;JGT

//Else if we're done blackening, jump to the keyboard listener loop
@LOOP
0;JMP

(END2)
