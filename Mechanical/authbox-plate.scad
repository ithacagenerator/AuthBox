// include <raspberrypi.scad>;
include <cyl_head_bolt.scad>
$fn = 64;
epsilon=0.1;
height = 3;
width = 200;
length = 200;
screw_length = 6;
standoff_height=screw_length - height;
standoff_inner_diameter=3;
standoff_outer_diameter=6;

outlines=true;
outline_width = 1;

// this is the coordinates of the hole in the corner of the raspberry pi nearest the header pins
raspberrypi_llx = 0;
raspberrypi_lly = 0;
raspberrypi_rot = 0;

module mynutcatch() {    
    translate([0,0,epsilon]) nutcatch_parallel("M2.5");       
    translate([0,0,20]) hole_through("M3");
}

module mynutcatch_and_standoff(positive_shape=true) {
    if (positive_shape) {
        translate([0, 0, -(standoff_height + height)]) cylinder(standoff_height, d=standoff_outer_diameter);                           
    } else {
        union() {
            mynutcatch();
            translate([0, 0, -(standoff_height + height) - epsilon/2]) 
                cylinder(standoff_height+epsilon, d=standoff_inner_diameter);             
        }
    }
}


module raspberrypi_mount(positive_shape = true) {
    
    raspberrypi_mount_width =  58;
    raspberrypi_mount_length = 49;    
    llx = 0;
    lly = 0;
    urx = llx + raspberrypi_mount_width;
    ury = lly + raspberrypi_mount_length;
    if (positive_shape) {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=true);
        translate([llx, ury, 0]) mynutcatch_and_standoff(positive_shape=true);
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=true);
        translate([urx, ury, 0]) mynutcatch_and_standoff(positive_shape=true);
        
        if (outlines) {
            rpi_width = 85;
            rpi_height = 56;
            rpi_corner_radius = 3;
            rpi_corner_hole_offset = 3.5;
            rpi_outline_offsetx = rpi_width/2 - rpi_corner_hole_offset;
            rpi_outline_offsety = rpi_height/2 - rpi_corner_hole_offset;
            translate([rpi_outline_offsetx, rpi_outline_offsety, -height-standoff_height]) {        
              difference() {
                  hull() {
                       translate([-rpi_width/2 + rpi_corner_radius, -rpi_height/2 + rpi_corner_radius, 0]) cylinder(h=1, r=3);
                       translate([-rpi_width/2 + rpi_corner_radius, rpi_height/2 - rpi_corner_radius, 0]) cylinder(h=1, r=3);                  
                       translate([rpi_width/2 - rpi_corner_radius, -rpi_height/2 + rpi_corner_radius, 0]) cylinder(h=1, r=3);   
                       translate([rpi_width/2 - rpi_corner_radius, rpi_height/2 - rpi_corner_radius, 0]) cylinder(h=1, r=3);                  
                  }                       
                  hull() {
                       translate([-rpi_width/2+rpi_corner_radius+outline_width, -rpi_height/2+rpi_corner_radius+outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=3);
                       translate([-rpi_width/2+rpi_corner_radius+outline_width, rpi_height/2-rpi_corner_radius-outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=3);                  
                       translate([rpi_width/2-rpi_corner_radius-outline_width, -rpi_height/2+rpi_corner_radius+outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=3);   
                       translate([rpi_width/2-rpi_corner_radius-outline_width, rpi_height/2-rpi_corner_radius-outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=3);                  
                  }                     
              }
            }
        }
    } else {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([llx, ury, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([urx, ury, 0]) mynutcatch_and_standoff(positive_shape=false);
    }
    
}


intersection() {
    difference() {                
        union() {
            translate([0, 0, -height/2]) cube([width, length, height], center=true); // this is the substrate "floor"
            translate([raspberrypi_llx,raspberrypi_lly, 0]) rotate([0,0,raspberrypi_rot]) raspberrypi_mount(positive_shape=true); // these are the mounting standoffs for the raspberry pi
        }        
        
        translate([raspberrypi_llx,raspberrypi_lly, 0]) rotate([0,0,raspberrypi_rot]) raspberrypi_mount(positive_shape = false);  // these are the holes and nut catch for the raspberry pi
    }        
}
