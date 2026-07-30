"""
Test Google Sheets CSV parsing logic
"""
import urllib.request, json

url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&gid=0'

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        lines = text.splitlines()
        print(f"Downloaded {len(lines)} lines")
        for i in range(min(5, len(lines))):
            print(f"Line {i}: {lines[i][:100]}")
except Exception as e:
    print(f"Error: {e}")
