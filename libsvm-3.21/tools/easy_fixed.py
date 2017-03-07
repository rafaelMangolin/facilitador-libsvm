#!/usr/bin/env python

import sys
import os
from subprocess import *

if len(sys.argv) <= 1:
	print('Usage: {0} training_file [testing_file]'.format(sys.argv[0]))
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
file_name = '{0}/{1}'.format(sys.argv[5],os.path.split(train_pathname)[1])
scaled_file = file_name + ".scale"
model_file = file_name + ".model"
range_file = file_name + ".range"

if len(sys.argv) > 4:
	test_pathname = sys.argv[4]
	file_name = '{0}/{1}'.format(sys.argv[5],os.path.split(test_pathname)[1])
	assert os.path.exists(test_pathname),"testing file not found"
	scaled_test_file = file_name + ".scale"
	predict_test_file = file_name + ".predict"

cmd = '{0} -s "{1}" "{2}" > "{3}"'.format(svmscale_exe, range_file, train_pathname, scaled_file)
Popen(cmd, shell = True, stdout = PIPE).communicate()	

c = sys.argv[2]
g = sys.argv[3]

cmd = '{0} -c {1} -g {2} "{3}" "{4}"'.format(svmtrain_exe,c,g,scaled_file,model_file)
Popen(cmd, shell = True, stdout = PIPE).communicate()

if len(sys.argv) > 4:
	cmd = '{0} -r "{1}" "{2}" > "{3}"'.format(svmscale_exe, range_file, test_pathname, scaled_test_file)
	Popen(cmd, shell = True, stdout = PIPE).communicate()	
	cmd = '{0} "{1}" "{2}" "{3}" teste.out'.format(svmpredict_exe, scaled_test_file, model_file, predict_test_file)
	Popen(cmd, shell = True).communicate()	

	print('{0}'.format(predict_test_file))