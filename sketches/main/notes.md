### Links

Essentials:   
https://p5js.org/reference/  
https://github.com/processing/p5.js/wiki/Getting-started-with-WebGL-in-p5

NPM package: https://www.npmjs.com/package/p5  

Sound library: https://p5js.org/reference/#/libraries/p5.sound  

Math: https://betterexplained.com/articles/rethinking-arithmetic-a-visual-guide/  
Math, dealing with rotations: https://p5js.org/reference/#/p5/atan2

Figuring out the coordinate system when drawing in 3D: https://github.com/processing/p5.js/wiki/Getting-started-with-WebGL-in-p5#translate-rotate

Examples: https://p5js.org/examples/

### Can I use my audio output as input?

Short answer: No.

Long answer: It depends.  
Only if your machine happens to support it, and you know how to configure it, 
since this is for a large part handled on the OS level- and not an easy task in general.  
On MacOS you might want to use something like Soundflower to make it work, but I haven't tried it.  
On Windows you might be able to get things set up using the "Stereo Mix" hidden device under Sound settings.  
Still trying to get that working myself though so I can't really help there.

### Help, I'm having framerate issues!

This application has been setup to run at 10 frames(limited) by default to prevent too much load at once during startup.  
You can increase/decrease the framerate by clicking Q; it will go from 10 to 24, to 30, to 60, back to 10.   
Check the console to see at which framerate the page is currently rendering.

Please note:  
While WebGL uses hardware acceleration by default in most browsers,
be aware that on _some_ machines (e.g, mine),  
it still has a hard time figuring out I want it to use my dedicated graphics card
instead of that damned Intel integrated graphics.  
It might need some tinkering with your nvidia configuration, Control Panel settings, and/or
other menus to actually make it use both hardware accelerated graphics
_and_ the right graphics card for doing so.


https://www.quora.com/How-do-I-check-if-my-laptop-is-using-my-GPU-or-my-CPUs-integrated-graphics-for-playing-games

You can verify if this applies, on Windows by opening the Task Manager > Performance, 
and seeing the GPU loads.  
If you have multiple drivers, you'll see different GPUs with their respective card listed.  
Check the Processes section to see if the browser you're viewing the application on is running on a GPU with the same ID 
as the GPU you intend to be using(e.g. if your integrated graphics card is listed as GPU 0 and your dedicated one as GPU 1, 
then make sure your browser isn't listed as running on GPU 0 under "GPU Engine" (scroll to the right under Processes to see it.

In my case the Quadro M2000M was set up fine, but my other laptop with a GTX960M was defaulting to my Intel 510 integrated graphics card for some reason.

https://bugzilla.mozilla.org/show_bug.cgi?id=1365492#c11

Go to settings  
system  
display  
graphics settings  
add the browser to the list (firefox/chrome.exe, likely found under "Program Files (x86)", and then either Mozilla Firefox or Google/Chrome/Application)  
select the added browser  
select high performance (your gpu should be listed here)  
restart your browser if it is still open  
check the framerate limiter(see above) as your application starts limited to 10 fps by default, but even then you might already see a noticable improvement.



### Lessons learned

- 2D vs 3D coordinate systems
- incorrectly mapping one scale onto another,  
- AngleMode,  
- radius vs diameter when drawing circular shapes, 
- meaning of translating, 
- (not) using push/pop,
- Materials and lighting types, and how they sometimes prevent the right colors
- `atan` is used for dealing with rotation coordinates