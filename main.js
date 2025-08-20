const panel_height = Main.panel.height;
const elem_width = Main.panel.get_children().map(child=>child.width).reduce((a,b)=>a+b);
const min_width = elem_width + (panel_height*8);
const screen_width = global.screen_width;
const new_width = Math.min(min_width,screen_width);
const new_x = (screen_width - new_width) / 2;
const new_y = panel_height/2;
const new_radius = panel_height/2;

Main.panel.get_parent().x = new_x;
Main.panel.get_parent().y = new_y;
Main.panel.get_parent().width = new_width;
Main.panel.set_style("border-radius: " + new_radius + "px;")

