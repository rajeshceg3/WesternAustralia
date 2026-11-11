from PIL import Image
import json,re,numpy as np
root='/downloads/worlds-rank/wildlife-contrast';out=[]
def lum(a):
 a=np.array(a)/255.;v=np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4);return v@np.array([.2126,.7152,.0722])
for row in json.load(open(root+'/records.json')):
 back=np.array(Image.open(row['prefix']+'-backdrop.png').convert('RGB'));bl=np.array(Image.open(row['prefix']+'-black.png').convert('RGB'));wh=np.array(Image.open(row['prefix']+'-white.png').convert('RGB'));h,w=back.shape[:2];scale=w/row['width'];mask=np.max(abs(wh.astype(float)-bl.astype(float)),axis=2)>200
 for e in row['els']:
  r=e['rect'];x=max(0,int(r['x']*scale));y=max(0,int(r['y']*scale));xx=min(w,int((r['x']+r['width'])*scale));yy=min(h,int((r['y']+r['height'])*scale));m=mask[y:yy,x:xx];bg=back[y:yy,x:xx][m]
  if not len(bg):continue
  ink=list(map(float,re.findall(r'[\d.]+',e['ink'])))[:3];a=lum(ink);b=lum(bg);rat=(np.maximum(a,b)+.05)/(np.minimum(a,b)+.05);out.append(dict(width=row['width'],state=row['state'],element=e['i'],text=e.get('text',''),minimum=float(rat.min()),font=e['font'],glyphPixels=len(bg)))
json.dump(out,open('verification/contrast.json','w'),indent=2)
print('samples',len(out),'min',min(x['minimum'] for x in out));print([x for x in out if x['minimum']<4.5])
