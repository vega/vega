from wrangler import dw
import sys

if(len(sys.argv) < 3):
	sys.exit('Error: Please include an input and output file.  Example python script.py input.csv output.csv')

w = dw.DataWrangler()

# Split data repeatedly on newline  into  rows
w.add(dw.Split(column=["data"],
               table=0,
               status="active",
               drop=True,
               result="row",
               update=False,
               insert_position="right",
               row=None,
               on="\n",
               before=None,
               after=None,
               ignore_between=None,
               which=1,
               max=0,
               positions=None,
               quote_character=None))

# Split data repeatedly on ','
w.add(dw.Split(column=["data"],
               table=0,
               status="active",
               drop=True,
               result="column",
               update=False,
               insert_position="right",
               row=None,
               on=",",
               before=None,
               after=None,
               ignore_between=None,
               which=1,
               max=0,
               positions=None,
               quote_character=None))

# Promote row 1  to header
w.add(dw.SetName(column=[],
                 table=0,
                 status="active",
                 drop=True,
                 names=[],
                 header_row=0))

# Drop DATE
w.add(dw.Drop(column=["DATE"],
              table=0,
              status="active",
              drop=True))

# Drop HLYCLOD.PCTOVC
w.add(dw.Drop(column=["HLYCLOD.PCTOVC"],
              table=0,
              status="active",
              drop=True))

# Drop HLYWCHLNORMAL
w.add(dw.Drop(column=["HLYWCHLNORMAL"],
              table=0,
              status="active",
              drop=True))

# Drop HLYWINDAVGSPD
w.add(dw.Drop(column=["HLYWINDAVGSPD"],
              table=0,
              status="active",
              drop=True))

# Drop HLYWIND.PCTCLM
w.add(dw.Drop(column=["HLYWIND.PCTCLM"],
              table=0,
              status="active",
              drop=True))

# Drop hour
w.add(dw.Drop(column=["hour"],
              table=0,
              status="active",
              drop=True))

# Drop day
w.add(dw.Drop(column=["day"],
              table=0,
              status="active",
              drop=True))

w.apply_to_file(sys.argv[1]).print_csv(sys.argv[2])


