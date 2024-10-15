//======================================================================================================
//                                         Design Configuration
//======================================================================================================
//======================================================================================================
//                              			 Time and Storage
//======================================================================================================
let timer;
let local = window.localStorage;
let max_width, max_height; 
var mines, flags = 0, first_touch = false, lost = false, won = false;
//======================================================================================================
//               							   Game Fields
//======================================================================================================
field_width = document.getElementById("width");
field_height = document.getElementById("height");
field_flag = document.querySelector("#flags_score span");
field_mines = document.getElementById("mines");
field_highscore = document.querySelector("#highscore span");
blocks = document.querySelector(".blocks");
game = document.querySelector(".game");
time = document.querySelector("#time span");
//======================================================================================================
//    										 Game Buttons
//======================================================================================================
settings_button = document.querySelector(".settings");
close_button = document.querySelector(".close");
save_button = document.getElementById("save");
restart_button = document.getElementById("restart");
//======================================================================================================
//                                     	    EventListeners
//======================================================================================================
settings_button.addEventListener("click", ()=>open_menu());
close_button.addEventListener("click", ()=>close_menu());
save_button.addEventListener("click", ()=>save());
restart_button.addEventListener("click", ()=>location.reload());
field_width.addEventListener("change", ()=>{
	let max_width =  parseInt(window.innerWidth / 50)-1;
	let max_mines = parseInt(field_width.value)*parseInt(field_height.value)-9;
	check_min_max(field_width, 0, max_width);
	check_min_max(field_mines, 0, max_mines);
})
field_height.addEventListener("change", ()=>{
	let max_height = parseInt((game.offsetHeight-100) / 50)-1;
	let max_mines = parseInt(field_width.value)*parseInt(field_height.value)-9;
	check_min_max(field_height, 0, max_height);
	check_min_max(field_mines, 0, max_mines);
})
field_mines.addEventListener("change", ()=>{
	let max_mines = parseInt(field_width.value)*parseInt(field_height.value)-9;
	check_min_max(field_mines, 0, max_mines);
})
//======================================================================================================
//     										Loading process
//======================================================================================================
window.addEventListener("load", ()=>{
	load_settings();

	blocks.style.gridTemplateColumns = "repeat("+local.width+", 1fr)"
	for(let i = 0; i < local.height; i++)
	{
		for(let j = 0; j < local.width; j++)
		{
			let block = document.createElement("div");
			block.classList.add("block");
			block.classList.add("unrevealed");
			block.id = String(local.width*i+j);
			blocks.appendChild(block);
		}
	}
	if(blocks.offsetWidth > game.offsetWidth)
	{
		game.style.width = String(blocks.offsetWidth+(local.width-1)*2)+"px";
	}
	mineslist = new Array(local.width*local.height);
	GameConfig();
})
//======================================================================================================
function open_menu()
{
	let settings_popup = document.getElementById("settings_popup");
	if(settings_popup.style.display == "")
	{
		settings_popup.style.display = "flex";
	}
	load_settings();
}

function close_menu()
{
	let settings_popup = document.getElementById("settings_popup");
	if(settings_popup.style.display == "flex")
	{
		settings_popup.style.display = "";
	}
}

function save()
{
	let local = window.localStorage;
	if(!(local.width == field_width.value && local.height == field_height.value && local.mines == field_mines.value))
	{
		if(confirm("You need to reload the page to save !"))
		{
			local.width = field_width.value;
			local.height = field_height.value;
			local.mines = field_mines.value;
			location.reload();
		}
	}
}

function check_min_max(o, min, max)
{
	if(o.value > max)
	{
		o.value = max;
		alert("Info: max "+ o.id +": "+ max +"!");
	}
	else if(o.value < min)
	{
		o.value = min
		alert("Info: min "+ o.id +": "+ min +"!");
	}
	save_availabilty();
}

function save_availabilty()
{
	save_container = document.getElementById("sv_container");
	if(field_width.value != local.width || field_height.value != local.height || field_mines.value != local.mines)
	{
		save_container.style.opacity = "1";
	}
	else
	{
		save_container.style.opacity = ".5";
	}
}

function load_settings()
{
	mines = parseInt(local.mines);
	if(local.width == null || local.height == null|| local.mines == null || local.highscore == null)
	{
		local.clear();
	}
	else
	{
		field_width.value = local.width;
		field_height.value = local.height;
		field_mines.value = local.mines;
		field_highscore.innerHTML = local.highscore;

		document.querySelector("#flags_score span").innerHTML="0/"+local.mines;
	}

	if(local.length == 0)
	{
		local.width = 8;
		local.height = 8;
		local.mines = 10;
		local.highscore = "";
		document.querySelector("#flags_score span").innerHTML="0/"+local.mines;
	}
}

function spell_check(o)
{
	o.value = Number(String(o.value).replace(".", ""));
	o.value = Number(String(o.value).replace("e", ""));
	o.value = Number(String(o.value).replace("-", ""));
}

function updateTimer()
{
	time.innerHTML = convertSecTime(convertTimeSec(time.innerHTML)+1); 
}

function convertTimeSec(time)
{
	return Number(time.substr(0, 2)) * 60 + Number(time.substr(3, 2));
}

function convertSecTime(time)
{
	minute = parseInt(time/60);
	seconds = time%60;

	if(minute < 10)
	{
		if(seconds < 10)
		{
			return "0" + String(minute) + ":0" + String(seconds);
		}
		return "0" + String(minute) + ":" + String(seconds);
	}
	return String(minute) + ":" + String(seconds);
}
//======================================================================================================
//                                       GamePlay Configuration
//======================================================================================================
//======================================================================================================
// 												Methods
//======================================================================================================
function loadMines(first)
{
	mineslist.fill("");
	let i = 0;
	while(i < mines)
	{
		let random = Math.trunc(Math.random()*(local.width*local.height));
		while(mineslist[random] != "" || random == first || (surroundings(first).includes(random) && mines+surroundings(first).length < parseInt(local.width)*parseInt(local.height)))
		{
			random = Math.trunc(Math.random()*(local.width*local.height));
		}
		mineslist[random] = "mine";
		i++;
	}
}
function GameConfig()
{
	let blocks = document.querySelectorAll(".unrevealed");
	blocks.forEach(e => {
		e.addEventListener("contextmenu", (element)=>{
			element.preventDefault();
			if(!won && !lost && remainingMoves())
			{
				if(e.classList.contains("unrevealed"))
				{
					if(e.classList.contains("flag"))
					{
						e.classList.remove("flag");
						flags--;
					}
					else if(flags < mines)
					{
						e.classList.add("flag");
						flags++;
					}
				}
				field_flag.innerHTML = String(flags) + field_flag.innerHTML.substring(field_flag.innerHTML.indexOf('/'));
				if(!remainingMoves())
				{
					document.querySelectorAll(".unrevealed").forEach((e)=>{
						if(!e.classList.contains("flag"))
						{
							open(Number(e.id));
						}
					})
					winEvent();
				}	
			}
		});
		e.addEventListener("click", ()=>
		{
			if(!won && !lost)
			{
				if(!first_touch)
				{
					loadMines(Number(e.id));
					timer = setInterval(()=>updateTimer(),1000);
					blocks.forEach(el => {
						if(mineslist[Number(el.id)] == "") mineslist[Number(el.id)] = near_mines(Number(el.id));
					})
					first_touch = true;
				}
				if(checkmine(Number(e.id))) loseEvent(e);
				else if(e.classList.contains("unrevealed") && !e.classList.contains("flag"))
				{
					open(Number(e.id));
				}
			}
		});
	})
}
function showbombs(show)
{
	let counter = 0;
	for(let i = 0; i < local.height; i++)
	{
		for(let j = 0; j < local.width; j++)
		{
			let e = i*parseInt(local.width)+j;
			if(mineslist[e] == "mine" && htmlBlock(e).classList.contains("unrevealed") && !htmlBlock(e).classList.contains("flag"))
			{
				setTimeout(()=>{
					htmlBlock(e).classList.add(show);
					htmlBlock(e).classList.remove("unrevealed");
					htmlBlock(e).classList.add("revealed");
					
				},counter*50);
				counter++;
			}
		}
	}
	return counter;
}
function open(block)
{
	let i = parseInt(block/local.width), j = block%local.width, width = parseInt(local.width), height = parseInt(local.height);
	htmlBlock(block).classList.remove("unrevealed");
	htmlBlock(block).classList.add("revealed");
	
	if(mineslist[block] == "0")
	{
		surroundings(block).forEach(e => {
			if(htmlBlock(e).classList.contains("unrevealed")) open(e);
		});
	}
	else
	{
		htmlBlock(block).innerHTML = String(mineslist[block]);
		htmlBlock(block).classList.add("n"+mineslist[block]);
	}
	if(!remainingMoves()) winEvent();
}
function winEvent()
{
	won = true;
	clearInterval(timer);
	
	setTimeout(()=>{
		document.getElementById("announcement").style.display = "flex";
		document.querySelector("#announcement span").innerHTML = "<p>You Won!</p><br><p>Score: <span class='yellow'>"+time.innerHTML+"</span></p>";
	}, (showbombs("flag")+1)*50);
	if(local.highscore == "" || convertTimeSec(time.innerHTML) < convertTimeSec(local.highscore)) local.highscore = time.innerHTML;
}
function loseEvent(e)
{
	lost = true;
	e.classList.remove("unrevealed");
	e.classList.add("revealed");
	e.classList.add("red_bomb");
	
	setTimeout(()=>{
		document.getElementById("announcement").style.display = "flex";
		document.querySelector("#announcement span").innerHTML = "You Lost!";
	},showbombs("mine")*50);
}
function near_mines(block)
{
	let counter = 0, i = parseInt(block/local.width), j = block%local.width;
	if(i-1>=0)
	{
		if(j-1>=0 && mineslist[(i-1)*local.width+j-1] == "mine") counter++;
		if(j+1<local.width && mineslist[(i-1)*local.width+j+1] == "mine") counter++;
		if(mineslist[(i-1)*local.width+j] == "mine") counter++;
	}
	if(i+1<local.width)
	{
		if(j-1>=0 && mineslist[(i+1)*local.width+j-1] == "mine") counter++;
		if(j+1<local.width && mineslist[(i+1)*local.width+j+1] == "mine") counter++;
		if(mineslist[(i+1)*local.width+j] == "mine") counter++;
	}
	if(j-1>=0 && mineslist[i*local.width+j-1] == "mine") counter++;
	if(j+1<local.width && mineslist[i*local.width+j+1] == "mine") counter++;
	return counter;
}
//======================================================================================================
// 											Functions
//======================================================================================================

function surroundings(block)
{
	var res = [];

	let width = parseInt(local.width), height = parseInt(local.height);
	let i = parseInt(block/parseInt(local.width)) , j = block%parseInt(local.width);

	if(j+1 < local.width) res.push(i*width+j+1);
	if(j-1 >= 0) res.push(i*width+j-1);
	if(i-1 >= 0)
	{
		if(j+1 < local.width) res.push((i-1)*width+j+1);
		if(j-1 >= 0) res.push((i-1)*width+j-1);
		res.push((i-1)*width+j);
	}
	if(i+1 < height)
	{
		if(j+1 < local.width) res.push((i+1)*width+j+1);
		if(j-1 >= 0) res.push((i+1)*width+j-1);
		res.push((i+1)*width+j);
	}
	
	return res;
}
function remainingMoves()
{
	let moves = 0;
	for(let i = 0; i < local.height; i++)
	{
		for(let j = 0; j < local.width; j++)
		{
			if(htmlBlock(i*parseInt(local.width)+j).classList.contains("unrevealed") && !htmlBlock(i*parseInt(local.width)+j).classList.contains("flag") && mineslist[i*parseInt(local.width)+j] == "mine") moves++;
		}
	}
	return moves;
}
function htmlBlock(block)
{
	return document.getElementById(String(block));
}
function checkmine(place)
{
	return mineslist[place] == "mine";
}
//======================================================================================================
// 	End Code :)       		  @copyryight-Sakamata: github_user:Sakamta0 
//======================================================================================================