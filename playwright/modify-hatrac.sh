#!/bin/bash

PRESIGNED_URL_SIZE_THRESHOLD=10480000

# 32K unsinged
# PRESIGNED_URL_SIZE_THRESHOLD=32800
# 32K signed
# PRESIGNED_URL_SIZE_THRESHOLD=32900
# 256K unsigned
# PRESIGNED_URL_SIZE_THRESHOLD=267300
# 256K signed
# PRESIGNED_URL_SIZE_THRESHOLD=267400

sed -i -e "/presigned_url_size_threshold/s/:[^,]*,/: $PRESIGNED_URL_SIZE_THRESHOLD,/" /home/hatrac/hatrac_config.json
service httpd restart
