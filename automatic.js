// Para executar é necessario instalar o nodejs 5 ou > no pc, e com esse arquivo dentro da pasta q contem os arquivos de dados executar node script_msdsubset_cal.js
// Link para instalar nodejs https://nodejs.org/en/download/
'use strict';

const fs = require('fs'),
      exec = require('child_process').exec,
      pathName = process.argv[2] || 'libsvm_arqs';

try{
  fs.mkdirSync("./folds");
}catch(e){}

let 
    fold_result   = [],
    tags   = {};

function organizarCsv(arr,keys){
  arr.forEach((data)=>{
    let foldPredName = data.split('\n')[1],
      foldNum = foldPredName.replace(/[a-zA-Z._/]*/g,''),
      resultado_fd  = fs.createWriteStream('./folds/resultado_fold_'+foldNum+'.csv',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true}),
      readPredict = fs.readFileSync(foldPredName,'utf8').split('\n');

    readPredict.pop();
    let i = 0;
    resultado_fd.write(data.split('\n')[0]+';\n');
    resultado_fd.write('Chave do vetor;Classe Predita;Classe correta;\n');
    for(var key in keys){
      let data = keys[key];
      if(data.fold == foldNum){
        resultado_fd.write(key+';'+tags[readPredict[i++]]+';'+data.class+';\n');
      }
    }
  })

  // deleteFiles();
}

function gerarCsv(obj){
  resultado_fd.write(';'+tags.join(';')+';Taxa de acerto total\n','utf8');
  for(var key in obj){
    let fold = obj[key],
        toWrite = [key],
        totalPerc = 0;
    tags.forEach((data,index)=>{
      let total = fold[index].certo+fold[index].errado,
          perc  = (fold[index].certo/total)*100;
          perc = perc;
          totalPerc += perc;
      toWrite.push(perc.toFixed(4)+'%');
    })
    toWrite.push((totalPerc/tags.length).toFixed(4)+'%');
    resultado_fd.write(toWrite.join(';')+'\n','utf8');
  }
  deleteFiles();
}

function deleteFiles(){
  exec('rm fold_*', (error, stdout, stderr)=>{
    if(error){
      throw stderr;
    }
  })
}


/**
* Refatorado
*/
function execRuns(){
  let keys = readKeyFile(process.argv[2]);
  keys = readCharacteristicArrayFile(process.argv[3],keys);
  let folds = generateRuns(keys);
  if(isSingle){
    runLibsvmSingle(folds,keys);
  }else{
    runLibsvm(folds,null,keys);
  }
}

function readKeyFile(fileName){
  let keys = fs.readFileSync(fileName,'utf8').split('\n');
  let toReturn = {};
  keys.forEach((data)=>{
    data = data.split(';');
    toReturn[data[0]] = {class:data[1]};
    tags[data[1]] = true;
    if(data[2] != null){
      toReturn[data[0]].fold = data[2];
    }
  })
  tags = Object.keys(tags);
  return toReturn; 
}

function readCharacteristicArrayFile(fileName,keys){
  let characs = fs.readFileSync(fileName,'utf8').split('\n');
  characs.forEach((data)=>{
    data = data.split(' ');
    data.pop();
    let lastItem = data.pop();
    if(keys[lastItem]){
      keys[lastItem].vetor = data.map((value,index)=>{
        return (index+1)+':'+value;
      }).join(' ');
    }
  })
  return keys; 
}

function generateRuns(keys){
  if(countFolds == null){
     return generateByFile(keys);
  }
  return generateByCount(keys,countFolds);
}

function runLibsvmSingle(folds,keys){
  exec('./libsvm-3.21/tools/easy_c_g.py ./folds/all.txt .', (error, stdout, stderr)=>{
    if(error){
      throw stderr;
    }    
    let result = stdout.replace('\n','').split(' ');
    runLibsvm(folds,result,keys);
  })
}

function runLibsvm(folds,args,keys){
  let fold_name = folds.pop(),
    pyton_exec = isSingle?'./libsvm-3.21/tools/easy_fixed.py':'./libsvm-3.21/tools/easy.py',
    train_file = './folds/fold_'+fold_name+'_train.txt',
    test_file = './folds/fold_'+fold_name+'_test.txt',
    bash_str   = isSingle?[pyton_exec,train_file,args[0],args[1],test_file,'.']:[pyton_exec,train_file,test_file,'.'];
  exec(bash_str.join(' '), (error, stdout, stderr)=>{
    if(error){
      throw stderr;
    }
    fold_result.push(stdout);
    if(folds.length > 0) {
      runLibsvm(folds,args,keys);
    }else{
      organizarCsv(fold_result,keys);
    }
  })
};

function generateByFile(keys){
  let folds = getFolds(keys);
  let foldsArq = folds.reduce((a,b)=>{
    a[b] = {};
    a[b].test = fs.createWriteStream('folds/fold_'+b+'_test.txt',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true});
    a[b].train = fs.createWriteStream('folds/fold_'+b+'_train.txt',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true});
    return a; 
  },{})

  if(isSingle){
    foldsArq.all = {};
    foldsArq.all.fp=fs.createWriteStream('./folds/all.txt',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true});
  }

  for(var key in keys){
    let data = keys[key];
    fillFiles(data,foldsArq);
  };
  return folds;
}

function generateByCount(keys,count){
  let classSeparator = {};
  count = parseInt(count);
  for(var key in keys){
    let data = keys[key];
    classSeparator[data.class] = classSeparator[data.class] || 0;
    keys[key].fold = classSeparator[data.class] % count;
    classSeparator[data.class]++; 
  }
  return generateByFile(keys);
}

function fillFiles(data,foldsArq){
  let line = tags.indexOf(data.class)+' '+data.vetor+'\n';
  for(var fold in foldsArq){
    if(fold != 'all'){
      if(data.fold == fold){
        foldsArq[fold].test.write(line);
      }else{
        foldsArq[fold].train.write(line);
      }
    }
  }
  if(isSingle){
    foldsArq.all.fp.write(line);
  }
}

function getFolds(keys){
  let toReturn = {};
  for(var key in keys){
    let data = keys[key];
    toReturn[data.fold] = true;
  };
  return Object.keys(toReturn); 
}

/**
* Parte procedural da feramenta
*/
let isSingle = process.argv.filter(data=>data==='-s').length > 0;
let countFolds;
process.argv.forEach((data, index)=>{
  if(data === '-f'){
    countFolds = process.argv[index+1];
  }
});

execRuns();