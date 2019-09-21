// include <raspberrypi.scad>;
include <cyl_head_bolt.scad>
$fn = 64;
epsilon=0.1;
height = 6;
width = 600;
length = 600;
screw_length = 9;
standoff_height=screw_length - height;
standoff_inner_diameter=3;
standoff_outer_diameter=6;

outlines=true;
outline_width = 1;

// this is the coordinates of the hole in the corner of the raspberry pi nearest the header pins
raspberrypi_llx = 10;
raspberrypi_lly = 10;
raspberrypi_rot = 0;

// this is the coordinates of the hole in the corner of the d-30 power supply
psu_llx = -100;
psu_lly = -100;
psu_rot = 0;

// this is the coordinates of the center hole in the corner of the rfid reader
rfid_llx = 100;
rfid_lly = 0;
rfid_rot = 0;

module mynutcatch(nut_type="M2.5", hole_type="M3") {
    echo(nut_type);
    echo(hole_type);
    echo("-----");
    translate([0,0,epsilon]) nutcatch_parallel(name=nut_type);       
    translate([0,0,20]) hole_through(name=hole_type);
}

module mynutcatch_and_standoff(positive_shape=true, nostandoff=false, nut_type="M2.5", hole_type="M3") {
    if (positive_shape) {
        if(!nostandoff) {
            translate([0, 0, -(standoff_height+height)]) cylinder(standoff_height, d=standoff_outer_diameter);                           
        }
    } else {
        union() {
            mynutcatch(nut_type=nut_type, hole_type=hole_type);
            if(!nostandoff){
                translate([0, 0, -(standoff_height+height) - epsilon/2]) 
                    cylinder(standoff_height+epsilon, d=standoff_inner_diameter);             
            }
        }
    }
}

module myoutline(_width, _height, _corner_radius=3, _corner_hole_offset=3.5) {
    _outline_offsetx = _width/2 - _corner_hole_offset;
    _outline_offsety = _length/2 - _corner_hole_offset;
    translate([_outline_offsetx, _outline_offsety, -(height+standoff_height)]) {        
      difference() {
          hull() {
               translate([-_width/2 + _corner_radius, -_length/2 + _corner_radius, 0]) cylinder(h=1, r=_corner_radius);
               translate([-_width/2 + _corner_radius, _length/2 - _corner_radius, 0]) cylinder(h=1, r=_corner_radius);                  
               translate([_width/2 - _corner_radius, -_length/2 + _corner_radius, 0]) cylinder(h=1, r=_corner_radius);   
               translate([_width/2 - _corner_radius, _length/2 - _corner_radius, 0]) cylinder(h=1, r=_corner_radius);                  
          }                       
          hull() {
               translate([-_width/2+_corner_radius+outline_width, -_length/2+_corner_radius+outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=_corner_radius);
               translate([-_width/2+_corner_radius+outline_width, _length/2-_corner_radius-outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=_corner_radius);                  
               translate([_width/2-_corner_radius-outline_width, -_length/2+_corner_radius+outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=_corner_radius);   
               translate([_width/2-_corner_radius-outline_width, _length/2-_corner_radius-outline_width, -epsilon/2]) cylinder(h=1+epsilon, r=_corner_radius);                  
          }                     
      }
    }    
}

/////// RASPBERRY PI MOUNT ////////
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
            rpi_length = 56;            
            myoutline(_width=rpi_width, _length=rpi_length);
        }
    } else {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([llx, ury, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=false);
        translate([urx, ury, 0]) mynutcatch_and_standoff(positive_shape=false);
    }
    
}

/////// MEANWELL D-30 POWER SUPPLY ////////
module psu_mount(positive_shape = true) {
    psu_mount_width =  122.5;
    psu_mount_length = 85.5;    
    llx = 0;
    lly = 0;
    urx = llx + psu_mount_width;
    ury = lly + psu_mount_length;
    if (positive_shape) {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        translate([llx, ury, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        translate([urx, ury, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        
        translate([llx+73.5, lly-31, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        translate([llx + 73.5, lly+64, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=true, nut_type="M3");
        
        if (outlines) {
            psu_width = 129;
            psu_length = 98;
            myoutline(_width=psu_width, _length=psu_length);
        }
    } else {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
        translate([llx, ury, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
        translate([urx, ury, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
        translate([llx + 73.5, lly+31, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
        translate([llx + 73.5, lly+64, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=true, nut_type="M3");
    }
}

/////// SEEED RFID READER////////
module rfid_mount(positive_shape = true) {
    rfid_mount_width =  19;
    rfid_mount_length = 30.5;    
    llx = 0;
    lly = 0;
    urx = llx + rfid_mount_width;
    ury = lly + rfid_mount_length;
    if (positive_shape) {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=false, nut_type="M3");
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=false, nut_type="M3");
        translate([(urx+llx)/2, ury, 0]) mynutcatch_and_standoff(positive_shape=true, nostandoff=false, nut_type="M3");
        
        if (outlines) {
            rfid_width = 24.5;
            rfid_length = 43.5;
            translate([0, rfid_mount_width-rfid_width, 0]) myoutline(_width=rfid_width, _length=rfid_length);
        }
    } else {
        translate([llx, lly, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=false, nut_type="M3");
        translate([urx, lly, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=false, nut_type="M3");
        translate([(urx+llx)/2, ury, 0]) mynutcatch_and_standoff(positive_shape=false, nostandoff=false, nut_type="M3");
    }
}

intersection() {
    difference() {                
        union() {
            translate([0, 0, -height/2]) cube([width, length, height], center=true); // this is the substrate "floor"
            translate([raspberrypi_llx,raspberrypi_lly, 0]) rotate([0,0,raspberrypi_rot]) raspberrypi_mount(positive_shape=true);
            translate([psu_llx,psu_lly,0]) rotate([0,0,psu_rot]) psu_mount(positive_shape=true);
            translate([rfid_llx,rfid_lly,0]) rotate([0,0,rfid_rot]) rfid_mount(positive_shape=true);
        }        
        
        translate([raspberrypi_llx,raspberrypi_lly, 0]) rotate([0,0,raspberrypi_rot]) raspberrypi_mount(positive_shape = false); 
        translate([psu_llx,psu_lly,0]) rotate([0,0,psu_rot]) psu_mount(positive_shape=false);
        translate([rfid_llx,rfid_lly,0]) rotate([0,0,rfid_rot]) rfid_mount(positive_shape=false);
    }
}
