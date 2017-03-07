// Para executar é necessario instalar o nodejs 5 ou > no pc, e com esse arquivo dentro da pasta q contem os arquivos de dados executar node script_msdsubset_cal.js
// Link para instalar nodejs https://nodejs.org/en/download/
'use strict';

const fs          = require('fs'),
      exec        = require('child_process').exec,
      pathName    = process.argv[2] || 'libsvm_arqs';

try{
  fs.mkdirSync(pathName);
}catch(e){}

let fold          = fs.readFileSync('TUT-acoustic-scenes-2016-development/meta.txt','utf8').split('\n'),
    tags          = fs.readFileSync('TUT-acoustic-scenes-2016-development/class.txt','utf8').split('\n'),
    valores       = fs.readFileSync('acoustic_scene-0-0-rotulo.txt','utf8').split('\n'),
    resultado_fd  = fs.createWriteStream(pathName+'/resultado.csv',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true}),
    all_fd        = fs.createWriteStream(pathName+'/all.txt',{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true}),
    pasta_leitura = fs.readdirSync('TUT-acoustic-scenes-2016-development/evaluation_setup'),
    folds_name    = foldsNome(pasta_leitura),
    fold_result   = [],
    chave         = {},
    foldPredict   = {};


// remove ultima linha em branco
fold.pop();
valores.pop();


// Pega a tag e o nome da musica
fold.forEach((data) => {
	let arr        = data.split(/\t/g), //quebra a linha em um array como os 'tabs' (\t) como divisoria 
      nomeMusica = arr[0].replace('audio/','');
	chave[nomeMusica] = {tag:arr[1]};
})

// converte o vertor para o formato que o libsvm lê
valores.forEach((data)=>{
	let arr = data.split(' ');
	arr.pop(); //remove o espaço em branco do final 
	let index = arr.pop();
	chave[index].vetor = arr.map((data,index)=>{
		return (index+1)+':'+data;
	}).join(' ');

  let toWrite = tags.indexOf(chave[index].tag)+' '+chave[index].vetor+'\n';
  all_fd.write(toWrite,'utf8');
})

pasta_leitura.forEach((data)=>{
	let read  = fs.readFileSync('TUT-acoustic-scenes-2016-development/evaluation_setup/'+data,'utf8').split('\n'),
      write = fs.createWriteStream(pathName+'/'+data,{flags: 'w+',defaultEncoding: 'utf8',fd: null,mode: 0o666,autoClose: true});
   	read.pop();
   	read.forEach((data) => {
   		let arr = data.split('\t'),
   		toWrite,
   		label   = arr[0],
   		index   = label.replace('audio/','').replace('\r','');
   		toWrite = tags.indexOf(chave[index].tag)+' '+chave[index].vetor+'\n';
   		write.write(toWrite,'utf8');
   	})
})


exec('./libsvm-3.21/tools/easy_c_g.py ./'+ pathName +'/all.txt '+pathName, (error, stdout, stderr)=>{
  if(error){
    throw stderr;
  }
  
  let result = stdout.replace('\n','').split(' ');
  console.log(result);
  execTrain(folds_name,result);
})
// execTrain(folds_name,[ '32.0', '0.5' ]);

function foldsNome(arr){
  return arr.filter((data)=>{
    return data.indexOf('evaluate') !== -1;
  }).map((data)=>{
    return data.split('_')[0];
  })
}

function execTrain(arr,args){
  let fold_name     = arr.pop(),
    pyton_exec = './libsvm-3.21/tools/easy_fixed.py',
    train_file = './'+ pathName +'/'+fold_name+'_train.txt',
    c          = args[0],
    g          = args[1],
    test_file  = './'+ pathName +'/'+fold_name+'_test.txt',
    bash_str   = [pyton_exec,train_file,c,g,test_file,pathName];

  exec(bash_str.join(' '), (error, stdout, stderr)=>{
    if(error){
      throw stderr;
    }
    fold_result.push(stdout);
    if(arr.length > 0) {
      execTrain(arr,args);
    }else{
      organizarCsv(fold_result);
    }
  })
}

function organizarCsv(arr){
  arr.forEach((data)=>{
    let foldPredName = data.split('\n')[1],
        foldName    = foldPredName.split('/').pop().split('_')[0],
        readPredict = fs.readFileSync(foldPredName,'utf8').split('\n'),
        read        = fs.readFileSync('TUT-acoustic-scenes-2016-development/evaluation_setup/'+foldName+'_evaluate.txt','utf8').split('\n');
    read.pop();
    readPredict.pop();
    foldPredict[foldName] = {}
    readPredict.forEach((data,index)=>{
      let tag = read[index].split('\t')[1].replace('\r',''),
          id  = tags.indexOf(tag);
      if(!foldPredict[foldName][id]){
        foldPredict[foldName][id] = {
          certo: 0,
          errado: 0
        }
      }

      if(id == data){
        foldPredict[foldName][id].certo++;
      }else{
        foldPredict[foldName][id].errado++;
      }
    })
  })

  gerarCsv(foldPredict);
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
  exec('rm all*', (error, stdout, stderr)=>{
    if(error){
      throw stderr;
    }
  })
}