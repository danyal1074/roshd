import sys
import os
import tarfile
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST = '89.46.217.44'
USER = 'root'
PASS = 'c6khenbR98FpxqnM'
REMOTE_DIR = '/var/www/roshd'
LOCAL_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

TAR_NAME = 'deploy_fast.tar.gz'
TAR_PATH = os.path.join(LOCAL_ROOT, TAR_NAME)

print('Creating lightweight deployment tarball...', flush=True)

with tarfile.open(TAR_PATH, 'w:gz') as tar:
    # 1. backend core files
    tar.add(os.path.join(LOCAL_ROOT, 'backend', 'server.js'), arcname='backend/server.js')
    tar.add(os.path.join(LOCAL_ROOT, 'backend', 'db.js'), arcname='backend/db.js')
    
    # 2. scripts
    tar.add(os.path.join(LOCAL_ROOT, 'scripts', 'parse_barpa_pdf.py'), arcname='scripts/parse_barpa_pdf.py')
    tar.add(os.path.join(LOCAL_ROOT, 'scripts', 'seed_barpa_20_students.js'), arcname='scripts/seed_barpa_20_students.js')
    
    # 3. uploads & parsed data
    sample_pdf = os.path.join(LOCAL_ROOT, 'backend', 'uploads', 'barpa_sample.pdf')
    if os.path.exists(sample_pdf):
        tar.add(sample_pdf, arcname='backend/uploads/barpa_sample.pdf')

    parsed_json = os.path.join(LOCAL_ROOT, 'backend', 'data', 'parsed_barpa_20_students.json')
    if os.path.exists(parsed_json):
        tar.add(parsed_json, arcname='backend/data/parsed_barpa_20_students.json')

    # 4. compiled frontend index.html & assets ONLY (skip all mp4/mp3)
    dist_dir = os.path.join(LOCAL_ROOT, 'frontend', 'dist')
    if os.path.exists(dist_dir):
        tar.add(os.path.join(dist_dir, 'index.html'), arcname='frontend/dist/index.html')
        tar.add(os.path.join(dist_dir, 'index.html'), arcname='backend/public/index.html')
        
        assets_dir = os.path.join(dist_dir, 'assets')
        if os.path.exists(assets_dir):
            for f in os.listdir(assets_dir):
                f_path = os.path.join(assets_dir, f)
                if os.path.isfile(f_path):
                    tar.add(f_path, arcname=f'frontend/dist/assets/{f}')
                    tar.add(f_path, arcname=f'backend/public/assets/{f}')

size_mb = os.path.getsize(TAR_PATH) / (1024 * 1024)
print(f'Fast tarball created: {size_mb:.2f} MB', flush=True)

print(f'Connecting to {HOST}...', flush=True)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print('Connected successfully!', flush=True)

def run(cmd):
    print(f'>>> {cmd}', flush=True)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out.strip(), flush=True)
    if err:
        print('ERR:', err.strip(), flush=True)
    return out, err

print('Uploading tarball via SFTP...', flush=True)
sftp = ssh.open_sftp()
sftp.put(TAR_PATH, f'{REMOTE_DIR}/{TAR_NAME}')
sftp.close()
print('Upload complete!', flush=True)

# Extract
run(f'cd {REMOTE_DIR} && tar -xzf {TAR_NAME} && rm {TAR_NAME}')

# Run seed on remote
run(f'cd {REMOTE_DIR} && node scripts/seed_barpa_20_students.js')

# Restart PM2
run('pm2 restart roshd')

# Test local health & reports endpoint on server
run('curl -s http://127.0.0.1:5000/api/health')

ssh.close()
os.remove(TAR_PATH)
print('DEPLOYMENT FULLY COMPLETED!', flush=True)
