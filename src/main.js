/* global anime*/
// Note: ALL console.log WILL BE REMOVED WHEN PROJECT IS FINISHED

// prompt. Ew. Change later
let grid; // Grid are [y][x] due to structure of the table
let flag = 0;
const ui = document.getElementById("grid");
let p = []; // position (neighbor)
let explode;
let start;
let size;

function render() {
    // Handles all CSS class changes
    grid.forEach(a => {
        a.forEach(b => {
            if (!b.gi.hidden) {
                b.classList.add("revealed");
            }

            if (b.gi.flag) {
                b.classList.add("flag");
            } else if (!b.gi.flag) {
                b.classList.remove("flag");
            }
        });
    });
}

function reveal(gi) {
    // Boundary fill (check edge of grid and border but reveal hints)

    let r = 0;
    let pos = [Math.trunc(gi.id / grid.length), gi.id % grid.length];

    if (grid[pos[0]][pos[1]].innerHTML.length <= 0) {
        // horizontal (left, right)
        for (let i = pos[1] - 1; i < pos[1] + 2; i++) {
            if (i === pos[1] || i < 0 || i >= grid.length) {
                // check if same or out of range
                continue;
            }

            if (!grid[pos[0]][i].gi.mine && grid[pos[0]][i].gi.hidden) {
                grid[pos[0]][i].gi.hidden = false;
                grid[pos[0]][i].gi.flag = false;
                r++;
                p.push(grid[pos[0]][i]);
            }
        }

        // vertical (top, bottom)
        for (let i = pos[0] - 1; i < pos[0] + 2; i++) {
            if (i === pos[0] || i < 0 || i >= grid.length) {
                continue;
            }

            if (!grid[i][pos[1]].gi.mine && grid[i][pos[1]].gi.hidden) {
                grid[i][pos[1]].gi.hidden = false;
                grid[i][pos[1]].gi.flag = false;
                r++;
                p.push(grid[i][pos[1]]);
            }
        }

        if (r > 0) {
            p.forEach(i => {
                if (!i.chk) {
                    i.chk = true;
                    reveal(i.gi);
                }
            });
            p = [];
        }
    }
}

class GridItem {
    constructor(i) {
        // pos based on array pos
        this.id = i;
        this.hidden = true;
        this.mine = false;
        this.flag = false;
        this.update = () => {
            if (this.hidden) {
                if (this.flag) {
                    // Prevents click on flag. Do not remove.
                    return;
                } else if (this.mine) {
                    // Prevents click on grid while animating
                    document.querySelectorAll("td").forEach(i => {
                        i.style.pointerEvents = "none";
                    });

                    // Add to explosion timeline
                    explode.add({
                        targets: "td",
                        scale: [
                            {value: 0.01, easing: "easeOutCubic", duration: 10},
                            {value: 1, easing: "easeInSine", duration: 150}
                        ],
                        translateZ: anime.stagger([0, 20, 0], {
                            grid: [grid.length, grid.length],
                            from: "center",
                            axis: "y"
                        }),
                        backgroundColor: [
                            {value: "#ff0", easing: "easeOutCubic", duration: 100},
                            "#f00",
                            "#444"
                        ],
                        delay: anime.stagger(250, {
                            grid: [grid.length, grid.length],
                            from: this.id
                        }),
                        complete: function () {
                            // END GAME

                            startGame("MINE EXPLODED");
                        }
                    });

                    explode.play();
                    return;
                } else {
                    reveal(this);
                }
                this.hidden = false;
            }
            render();
        };
    }
}

// Grid init
// The grid. A digital frontier. I tried to... wait, wrong game
const init = s => {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("grid").innerHTML = "";
    document.getElementById("size").innerHTML = s;

    // anime js timelines
    explode = anime.timeline({
        duration: 1000,
        autoplay: false,
        easing: "easeInOutQuint"
    });

    start = anime.timeline({
        duration: 500,
        easing: "easeInOutCubic"
    });

    // clear variables
    let ml = [];
    p = [];
    grid = [];
    flag = 0;

    if ((s > 30) | (s < 5) || !s) {
        // I don't want to deal with 1mil x 1mil grids
        console.error("Grid Size out of range, aborting...");
        window.alert("Internal Error (Grid out of range)");
    } else {
        let m = Math.ceil(Math.sqrt(s) + 8) / 100;

        for (let a = 0; a < s; a++) {
            // Yes, we are working with table grids again. Dang it.
            let r = ui.insertRow(-1);
            grid[a] = [];

            for (let b = 0; b < s; b++) {
                let c = r.insertCell(-1);
                grid[a][b] = c;

                // Right Click handling
                c.oncontextmenu = () => {
                    if (c.gi.hidden) {
                        if (c.gi.mine) {
                            if (flag > 0 && !c.gi.flag) {
                                flag -= 1;
                            } else {
                                flag += 1;
                            }
                        }
                        c.gi.flag = !c.gi.flag;
                        if (c.gi.flag) {
                            // Due to js'es flexibility we can just subtract a number from a string that is known
                            //     to be a number
                            document.getElementById("flags").innerText =
                                (document.getElementById("flags").innerText - 1).toString();
                        } else {
                            // Although we can not add a number to a string it would just concat it to the strings end
                            // BUT!, this bodge-trick allows us so add number by just negating the number
                            //     and the subtracting it
                            document.getElementById("flags").innerText =
                                (document.getElementById("flags").innerText - -1).toString();
                        }
                        render();
                    }
                    if (flag === 0) {
                        // eww
                        // Indeed
                        window.alert("WIN!");
                    }
                    return false;
                };

                // dynamic sizing
                c.style.height = 375 / s + "px";
                c.gi = new GridItem(b + s * a);
                c.innerHTML = "0";

                // mine generation
                if (Math.random() < m) {
                    c.gi.mine = true;
                    ml.push([a, b]);
                    flag += 1;
                }

                c.addEventListener("click", c.gi.update);
            }
        }

        document.getElementById("flags").innerText = flag.toString();

        // Hint Generation
        ml.forEach(a => {
            for (let b = a[1] - 1; b < a[1] + 2; b++) {
                if (b + 1 !== s + 1 && b >= 0) {
                    if (a[0] - 1 >= 0) {
                        grid[a[0] - 1][b].innerHTML =
                            parseInt(grid[a[0] - 1][b].innerHTML) + 1;
                    }
                    grid[a[0]][b].innerHTML = parseInt(grid[a[0]][b].innerHTML) + 1;
                    if (a[0] + 1 !== s) {
                        grid[a[0] + 1][b].innerHTML =
                            parseInt(grid[a[0] + 1][b].innerHTML) + 1;
                    }
                }
            }
        });

        // clear hints that are 0
        grid.forEach(a => {
            a.forEach(b => {
                if (b.innerHTML === "0" || b.mine === true) {
                    b.innerHTML = "";
                }
            });
        });

        // Start animation
        start
            .add({
                targets: "table",
                translateY: ["-500", "0"]
            })
            .add(
                {
                    targets: "td",
                    translateY: ["-100", "0"],
                    delay: anime.stagger(30, {
                        grid: [s, s],
                        from: "center"
                    })
                },
                "-=500"
            );

        start.play();
    }
};

function startGame(customMessage) {
    document.getElementById("overlay").style.display = "block";

    size = parseInt(
        window.prompt(customMessage ? customMessage + ", Grid Size" : "Grid Size")
    );
    init(size);
}

startGame();
