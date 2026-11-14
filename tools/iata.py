"""Build data/iata-icao.json (IATA airport code -> ICAO) from OurAirports (public domain).
Usage: python3 tools/iata.py airports.csv data/iata-icao.json
Source: https://davidmegginson.github.io/ourairports-data/airports.csv"""
import csv,json,sys
src,out=sys.argv[1],sys.argv[2]
rank={'large_airport':0,'medium_airport':1,'small_airport':2}
m={}
for r in csv.DictReader(open(src,encoding='utf-8')):
    iata=(r['iata_code'] or '').strip().upper(); icao=(r['icao_code'] or r['gps_code'] or '').strip().upper()
    if len(iata)!=3 or not iata.isalpha() or len(icao)!=4 or not icao.isalnum(): continue
    if r['type'] not in rank: continue
    sched=r['scheduled_service']=='yes'
    key=(0 if sched else 1, rank[r['type']])
    if iata not in m or key<m[iata][0]: m[iata]=(key,icao)
# keep airports with scheduled service, or large/medium
res={k:v[1] for k,v in sorted(m.items()) if v[0][0]==0 or v[0][1]<=1}
json.dump(res,open(out,'w'),separators=(',',':'))
print(len(res),'entries')
for k in ['LHR','DTW','SLC','HND','NRT','SYD','DXB','JFK','ANC','HNL','CDG','FRA','YYZ','MEX','GRU','ICN','PEK','SIN','DEL']:print(k,res.get(k))
