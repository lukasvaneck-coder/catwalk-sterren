import subprocess,sys,json,re
from pathlib import Path
out=Path('test-results/mobile-audit');out.mkdir(parents=True,exist_ok=True)
session=sys.argv[1];results=[]
for name in sys.argv[2:]:
 p=subprocess.run(['cmd','/c','playwright-cli','-s='+session,'run-code','--filename=tools/'+name+'.js'],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=300)
 log=p.stdout+p.stderr;(out/(name+'.log')).write_text(log,encoding='utf-8')
 ok=p.returncode==0 and '### Error' not in log
 summary=log.split('### Result\n',1)[-1].split('### Ran',1)[0].strip() if ok else log[:1800]
 results.append({'test':name,'passed':ok,'summary':summary});print(json.dumps(results[-1],ensure_ascii=True),flush=True)
 (out/(session+'-results.json')).write_text(json.dumps(results,indent=2),encoding='utf-8')
