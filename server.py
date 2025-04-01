from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import os
import warnings
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 忽略urllib3的警告
warnings.filterwarnings("ignore", category=Warning)

app = Flask(__name__, static_url_path='', static_folder='.', template_folder='templates')
# 配置CORS，允许所有来源
CORS(app)

# 加载环境变量
load_dotenv()

# API配置
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')  # 从环境变量获取API密钥
API_URL = 'https://api.deepseek.com/v1/chat/completions'

# 配置请求重试策略
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504]
)

session = requests.Session()
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("https://", adapter)
session.mount("http://", adapter)

@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    try:
        return send_from_directory('.', path)
    except Exception as e:
        logger.error(f"文件访问错误 {path}: {str(e)}")
        return f"文件未找到: {path}", 404

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not DEEPSEEK_API_KEY:
            logger.error("API密钥未找到")
            return jsonify({'error': '未找到API密钥，请检查.env文件'}), 500
            
        data = request.json
        logger.info(f"接收到的请求数据: {json.dumps(data, ensure_ascii=False)}")
        
        # 构建API请求数据
        api_request = {
            "model": "deepseek-chat",
            "messages": data.get('messages', []),
            "temperature": 0.7,
            "max_tokens": 2000,
            "top_p": 0.95,
            "stream": False
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
        }
        
        logger.info(f"正在发送请求到 {API_URL}")
        logger.info(f"请求数据: {json.dumps(api_request, ensure_ascii=False)}")
        
        # 使用session发送请求
        response = session.post(
            API_URL,
            headers=headers,
            json=api_request,
            timeout=(5, 60)  # (连接超时, 读取超时)
        )
        
        logger.info(f"API响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            error_text = response.text
            logger.error(f"API错误响应: {error_text}")
            try:
                error_json = response.json()
                error_message = error_json.get('error', {}).get('message', error_text)
            except:
                error_message = error_text
                
            return jsonify({
                'error': f'API请求失败: {response.status_code}',
                'details': error_message
            }), response.status_code
            
        result = response.json()
        logger.info(f"API响应成功: {json.dumps(result, ensure_ascii=False)}")
        return jsonify(result)
        
    except requests.exceptions.ConnectTimeout:
        logger.error("API连接超时")
        return jsonify({'error': 'API连接超时，请检查网络连接'}), 504
    except requests.exceptions.ReadTimeout:
        logger.error("API读取超时")
        return jsonify({'error': 'API响应超时，请稍后重试'}), 504
    except requests.exceptions.SSLError as e:
        logger.error(f"SSL错误: {str(e)}")
        return jsonify({'error': f'SSL连接错误: {str(e)}'}), 500
    except requests.exceptions.RequestException as e:
        logger.error(f"请求异常: {str(e)}")
        return jsonify({'error': f'网络请求错误: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"其他异常: {str(e)}")
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500

@app.route('/api/test', methods=['GET', 'OPTIONS'])
def test():
    try:
        logger.info("收到测试请求")
        return jsonify({
            'status': 'ok',
            'message': '服务器正常运行'
        })
    except Exception as e:
        logger.error(f"测试接口异常: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/generate-tags', methods=['POST'])
def generate_tags():
    try:
        data = request.json
        image_files = data.get('imageFiles', [])
        text_content = data.get('textContent', '')
        
        # 构建完整的描述
        full_description = ''
        
        if image_files:
            full_description += '图片分析：\n' + '\n'.join(image_files) + '\n\n'
            
        if text_content:
            full_description += '文字分析：\n' + text_content
            
        system_prompt = '''你是人格分析大师，擅长通过某人聊天的风格、文字的风格，客观分析这个人的性格特点与偏好。

▎限制条件
- 思考时不要着急，全面结合所有信息，想透彻
- 只输出角色要求的内容，不要输出多余的语句

▎擅长技能
- 解读生活化语言
- 分析聊天风格
- 识别性格特征
- 洞察个人偏好

▎表述语气
- 简洁、直接
- 客观、中立

▎工作流程
1. 输入：阅读用户上传有关联系人的文字、解析用户上传的、与联系人相关的图片
2. 思考：结合你的经验，通过文字分析联系人的人格
3. 输出：输出3-5个关于联系人的标签，可以关于性格，也可以关于爱好

▎要求
1. 禁止使用markdown格式
2. 禁止人身攻击
3. 每个标签不超过4个汉字
4. 标签要积极正面，避免消极或贬义
5. 标签要具体且有特点，避免过于笼统
6. 直接返回标签列表，每行一个标签，不要其他任何解释'''
        
        logger.info(f"生成标签请求数据: {json.dumps({'text': text_content, 'images': image_files}, ensure_ascii=False)}")
        
        response = requests.post(
            'https://api.deepseek.com/chat/completions',
            headers={
                'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': full_description}
                ],
                'temperature': 0.7,
                'stream': False
            }
        )
        
        if response.status_code != 200:
            logger.error(f"API调用失败: {response.status_code} - {response.text}")
            return jsonify({'error': '调用AI服务失败'}), 500
            
        result = response.json()
        if not result.get('choices') or not result['choices'][0].get('message'):
            logger.error(f"API返回格式错误: {result}")
            return jsonify({'error': '生成标签失败'}), 500
            
        tags = result['choices'][0]['message']['content'].split('\n')
        tags = [tag.strip() for tag in tags if tag.strip()]
        
        return jsonify(tags)
        
    except Exception as e:
        logger.error(f"生成标签时发生错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = 5002
    print(f"服务器正在启动，端口: {port}")
    print(f"测试地址: http://localhost:{port}/api/test")
    
    app.run(
        host='localhost',
        port=port,
        debug=True
    ) 