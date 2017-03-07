#!/usr/bin/env python

import sys
import os
from subprocess import *

if len(sys.argv) <= 1:
	print('Usage: {0} training_file'.format(sys.argv[0]))
	raise SystemExit

svmscale_exe = "./libsvm-3.21/svm-scale"
svmtrain_exe = "./libsvm-3.21/svm-train"
svmpredict_exe = "./libsvm-3.21/svm-predict"
grid_py = "./libsvm-3.21/tools/grid.py"


assert os.path.exists(svmscale_exe),"svm-scale executable not found"
assert os.path.exists(svmtrain_exe),"svm-train executable not found"
assert os.path.exists(svmpredict_exe),"svm-predict executable not found"
assert os.path.exists(grid_py),"grid.py not found"

train_pathname = sys.argv[1]
assert os.path.exists(train_pathname),"training file not found"
file_name = os.path.split(train_pathname)[1]
scaled_file = file_name + ".scale"
model_file = file_name + ".model"
range_file = file_name + ".range"

cmd = '{0} -s "{1}" "{2}" > "{3}"'.format(svmscale_exe, range_file, train_pathname, scaled_file)
Popen(cmd, shell = True, stdout = PIPE).communicate()	

cmd = '{0} -svmtrain "{1}" -gnuplot "null" "{2}"'.format(grid_py, svmtrain_exe, scaled_file)
f = Popen(cmd, shell = True, stdout = PIPE).stdout

line = ''
while True:
	last_line = line
	line = f.readline()
	if not line: break
c,g,rate = map(float,last_line.split())
print('{0} {1}'.format(c,g))